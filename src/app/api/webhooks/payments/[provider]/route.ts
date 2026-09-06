import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments/provider";

/**
 * Secure webhook route for payment provider events.
 * - Verifies signature on raw body (distinguish 400 vs 500)
 * - Validates amount/currency against DB product and checkout_attempt
 * - Idempotency per event (provider, provider_event_id)
 * - State transitions with allow-list, prevents old event from reverting refund
 * - Atomic order+entitlement via DB function, with recovery via payment_events
 */

function isSignatureError(msg: string): boolean {
  return msg.includes("Invalid signature") || msg.includes("Missing stripe-signature") || msg.includes("No signatures found");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerName } = await params;
  const admin = createAdminClient();

  let event: Awaited<ReturnType<ReturnType<typeof getPaymentProvider>["verifyWebhook"]>> | null = null;
  try {
    const provider = getPaymentProvider();
    if (provider.name !== providerName) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }
    event = await provider.verifyWebhook(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook verification failed";
    if (isSignatureError(msg)) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    // Invalid provider config or malformed event -> 400, internal -> 500
    if (msg.includes("not configured") || msg.includes("Invalid product")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("Webhook verify error:", msg);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  // Validate product and amount/currency if it's a payment event
  // Need to fetch product for both digital and physical to verify
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let product: any = null;
  if (event.productId) {
    const { data } = await admin
      .from("products")
      .select("base_price_minor, price, currency, status, delivery_method, hosted_access_type, requires_shipping")
      .eq("id", event.productId)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product = data as unknown as any;
  }

  // For payment events, verify amount/currency unless it's refund where amount may be partial
  if ((event.type === "payment.completed" || event.type === "payment.failed") && product) {
    if (product.status !== "published") {
      return NextResponse.json({ error: "Invalid product for payment" }, { status: 400 });
    }
    const expectedMinor =
      typeof product.base_price_minor === "number" && product.base_price_minor !== null
        ? product.base_price_minor
        : Math.round((product.price || 0) * 100);
    const expectedCurrency = (product.currency || "USD").toUpperCase();
    const eventCurrency = (event.currency || "").toUpperCase();
    if (event.amount !== expectedMinor || eventCurrency !== expectedCurrency) {
      console.error("Payment amount/currency mismatch", { expectedMinor, expectedCurrency, event });
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
    }
    // Also verify against checkout_attempt if exists (to ensure not tampered via metadata)
    if (event.rawPayload && typeof event.rawPayload === "object") {
      const raw = event.rawPayload as Record<string, unknown>;
      const stripeMeta = (raw.object as Record<string, unknown>)?.metadata as Record<string, string> | undefined;
      const attemptId = stripeMeta?.attemptId || (raw.metadata as Record<string, string>)?.attemptId;
      if (attemptId) {
        const { data: attempt } = await admin.from("checkout_attempts").select("amount_minor, currency, product_id").eq("id", attemptId).single();
        if (attempt) {
          if (attempt.amount_minor !== event.amount || (attempt.currency || "").toUpperCase() !== eventCurrency || attempt.product_id !== event.productId) {
            console.error("Checkout attempt mismatch", { attempt, event });
            return NextResponse.json({ error: "Checkout attempt mismatch" }, { status: 400 });
          }
        }
      }
    }
  }

  // Idempotency per event
  const rawId = (event.rawPayload as { id?: string; stripeEventId?: string })?.id || (event.rawPayload as { stripeEventId?: string })?.stripeEventId;
  const eventId = rawId || `${event.providerOrderId}:${event.type}:${event.productId}`;
  const { data: existingEvent } = await admin
    .from("payment_events")
    .select("id")
    .eq("provider", providerName)
    .eq("provider_event_id", eventId)
    .maybeSingle();
  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Claim idempotency first (insert payment_events)
  // Store limited payload: only id, type, providerOrderId, amount, currency, not full raw
  const limitedPayload = {
    id: eventId,
    type: event.type,
    providerOrderId: event.providerOrderId,
    productId: event.productId,
    amount: event.amount,
    currency: event.currency,
  };
  const { error: evtErr } = await admin.from("payment_events").insert({
    provider: providerName,
    provider_event_id: eventId,
    event_type: event.type,
    payload: limitedPayload,
  });
  if (evtErr) {
    if (evtErr.code === "23505" || evtErr.message.includes("duplicate")) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // If fails due to race, check again
    const { data: race } = await admin.from("payment_events").select("id").eq("provider", providerName).eq("provider_event_id", eventId).maybeSingle();
    if (race) return NextResponse.json({ received: true, duplicate: true });
    console.error("Failed to insert payment_event", evtErr.message);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }

  // Helper to check order exists for idempotency on payment.completed/failed
  if (event.type === "payment.completed" || event.type === "payment.failed") {
    const { data: existingOrder } = await admin
      .from("orders")
      .select("id, payment_status")
      .eq("provider", providerName)
      .eq("provider_order_id", event.providerOrderId)
      .maybeSingle();
    if (existingOrder) {
      // Already processed, but ensure state transition is valid (prevent old event reverting)
      // If existing is paid and new is failed, ignore
      // If existing is refunded/cancelled and new is paid, ignore (old payment after refund)
      if (existingOrder.payment_status === "paid" && event.type === "payment.failed") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      if ((existingOrder.payment_status === "refunded" || existingOrder.payment_status === "cancelled") && event.type === "payment.completed") {
        // Old payment after refund/cancel should not revert
        return NextResponse.json({ received: true, duplicate: true });
      }
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  try {
    switch (event.type) {
      case "payment.completed": {
        if (!product || !event.productId) {
          return NextResponse.json({ error: "Product not found for payment" }, { status: 400 });
        }
        const isDigital = product.delivery_method === "hosted_file" && product.hosted_access_type === "paid";
        const isPhysical = !!product.requires_shipping;

        if (isDigital) {
          // Digital: atomic order+entitlement via RPC
          const { data: prodForEnt } = await admin.from("products").select("download_limit").eq("id", event.productId).single();
          const maxDownloads = prodForEnt?.download_limit ?? null;

          // Use RPC for atomic
          const { data: orderId, error: rpcErr } = await admin.rpc("create_order_with_entitlement" as never, {
            p_provider: providerName,
            p_provider_order_id: event.providerOrderId,
            p_product_id: event.productId,
            p_amount_minor: event.amount,
            p_currency: event.currency,
            p_customer_email: event.customerEmail || "unknown",
            p_customer_id: event.customerId || null,
            p_provider_payload: limitedPayload,
            p_max_downloads: maxDownloads,
          } as never);

          if (rpcErr) {
            console.error("RPC create_order_with_entitlement failed", rpcErr.message);
            // If unique violation, treat as duplicate
            if (rpcErr.code === "23505" || rpcErr.message.includes("duplicate")) {
              return NextResponse.json({ received: true, duplicate: true });
            }
            // Remove payment_events to allow retry (outbox pattern: we keep event but mark failed)
            await admin.from("payment_events").delete().eq("provider", providerName).eq("provider_event_id", eventId);
            return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
          }

          // Also mark checkout_attempt as completed if exists
          if (event.rawPayload) {
            const raw = event.rawPayload as Record<string, unknown>;
            const meta = ((raw.object as Record<string, unknown>)?.metadata as Record<string, string>) || (raw.metadata as Record<string, string>);
            const attemptId = meta?.attemptId;
            if (attemptId) {
              await admin.from("checkout_attempts").update({ status: "completed", provider_session_id: event.providerOrderId }).eq("id", attemptId);
            }
          }
        } else if (isPhysical) {
          // Physical: create customer_orders + order_items (simplified single product)
          // For now, create a minimal customer_orders entry
          const { data: existingCustOrder } = await admin.from("customer_orders").select("id").eq("order_number", event.providerOrderId).maybeSingle();
          if (existingCustOrder) {
            return NextResponse.json({ received: true, duplicate: true });
          }
          // Need shipping address snapshot - use placeholder if not provided
          const shippingSnapshot = {
            full_name: event.customerEmail || "Customer",
            phone: "",
            country_code: "MA",
            city: "Casablanca",
            region: null,
            postal_code: null,
            address_line_1: "Pending",
            address_line_2: null,
            delivery_notes: null,
          };
          const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          const { data: custOrder, error: custErr } = await admin
            .from("customer_orders")
            .insert({
              order_number: orderNumber,
              user_id: event.customerId,
              status: "confirmed",
              payment_method: "online_payment",
              payment_status: "paid",
              fulfillment_status: "unfulfilled",
              currency: event.currency,
              subtotal_minor: event.amount,
              total_minor: event.amount,
              shipping_address_snapshot: shippingSnapshot,
              customer_email: event.customerEmail || "unknown",
            })
            .select("id")
            .single();
          if (custErr || !custOrder) {
            console.error("Failed to create customer_order", custErr?.message);
            await admin.from("payment_events").delete().eq("provider", providerName).eq("provider_event_id", eventId);
            return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
          }
          // Insert order item
          await admin.from("order_items").insert({
            order_id: custOrder.id,
            product_id: event.productId,
            product_name: product ? "Product" : event.productId,
            sku: "N/A",
            unit_price_minor: event.amount,
            quantity: 1,
            line_total_minor: event.amount,
          });
          // Commit inventory if stock managed (simplified)
          // Assume variant handling not needed for single product
        } else {
          // Fallback to digital handling
          const { data: prodForEnt } = await admin.from("products").select("download_limit").eq("id", event.productId).single();
          const maxDownloads = prodForEnt?.download_limit ?? null;
          const { error: rpcErr } = await admin.rpc("create_order_with_entitlement" as never, {
            p_provider: providerName,
            p_provider_order_id: event.providerOrderId,
            p_product_id: event.productId,
            p_amount_minor: event.amount,
            p_currency: event.currency,
            p_customer_email: event.customerEmail || "unknown",
            p_customer_id: event.customerId || null,
            p_provider_payload: limitedPayload,
            p_max_downloads: maxDownloads,
          } as never);
          if (rpcErr) {
            await admin.from("payment_events").delete().eq("provider", providerName).eq("provider_event_id", eventId);
            return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
          }
        }
        break;
      }

      case "payment.failed": {
        // Check if already exists
        const { data: existing } = await admin.from("orders").select("id").eq("provider", providerName).eq("provider_order_id", event.providerOrderId).maybeSingle();
        if (existing) {
          return NextResponse.json({ received: true, duplicate: true });
        }
        await admin.from("orders").insert({
          customer_email: event.customerEmail || "unknown",
          product_id: event.productId,
          provider: providerName,
          provider_order_id: event.providerOrderId,
          amount: event.amount,
          currency: event.currency,
          payment_status: "failed",
          provider_payload: limitedPayload,
          user_id: event.customerId || null,
        });
        // Mark attempt failed
        if (event.rawPayload) {
          const raw = event.rawPayload as Record<string, unknown>;
          const meta = ((raw.object as Record<string, unknown>)?.metadata as Record<string, string>) || (raw.metadata as Record<string, string>);
          const attemptId = meta?.attemptId;
          if (attemptId) await admin.from("checkout_attempts").update({ status: "failed" }).eq("id", attemptId);
        }
        break;
      }

      case "refund.completed": {
        // Find order and check transition
        const { data: orderToUpdate } = await admin
          .from("orders")
          .select("id, payment_status")
          .eq("provider", providerName)
          .eq("provider_order_id", event.providerOrderId)
          .maybeSingle();

        if (orderToUpdate) {
          // Only allow refund if currently paid
          const { data: valid } = await admin.rpc("is_valid_order_transition" as never, {
            p_current: orderToUpdate.payment_status,
            p_next: "refunded",
          } as never);
          // is_valid returns boolean; if false, ignore old event
          if (valid === false) {
            return NextResponse.json({ received: true, duplicate: true });
          }
          await admin.from("orders").update({ payment_status: "refunded", refunded_at: new Date().toISOString() }).eq("id", orderToUpdate.id);
          await admin.from("download_entitlements").update({ revoked_at: new Date().toISOString() }).eq("order_id", orderToUpdate.id).is("revoked_at", null);
        } else {
          // Try physical order
          const { data: cust } = await admin.from("customer_orders").select("id, payment_status").eq("order_number", event.providerOrderId).maybeSingle();
          if (cust) {
            await admin.from("customer_orders").update({ payment_status: "refunded" }).eq("id", cust.id);
          }
        }
        break;
      }

      case "order.cancelled": {
        const { data: cancelOrder } = await admin.from("orders").select("id, payment_status").eq("provider", providerName).eq("provider_order_id", event.providerOrderId).maybeSingle();
        if (cancelOrder) {
          const { data: valid } = await admin.rpc("is_valid_order_transition" as never, { p_current: cancelOrder.payment_status, p_next: "cancelled" } as never);
          if (valid === false) return NextResponse.json({ received: true, duplicate: true });
          await admin.from("orders").update({ payment_status: "cancelled" }).eq("id", cancelOrder.id);
          // Optionally revoke entitlement if not yet paid? Keep as is
        } else {
          const { data: cust } = await admin.from("customer_orders").select("id, payment_status").eq("order_number", event.providerOrderId).maybeSingle();
          if (cust) {
            await admin.from("customer_orders").update({ status: "cancelled", payment_status: "cancelled" }).eq("id", cust.id);
          }
        }
        break;
      }

      default:
        // Unhandled event type, acknowledge but do nothing
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error("Webhook error:", message);
    // Don't delete payment_events here, keep for investigation
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
