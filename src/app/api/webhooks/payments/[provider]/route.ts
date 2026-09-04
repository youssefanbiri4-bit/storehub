import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments/provider";

/**
 * Secure webhook route for payment provider events.
 * Verifies the webhook signature, processes the event, and creates
 * orders + entitlements only after verified payment.
 *
 * Must return:
 * - 200 for successful processing (including idempotent duplicates)
 * - 400 for invalid signatures or malformed events
 * - 500 for internal errors
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerName } = await params;
  const admin = createAdminClient();

  try {
    // Verify webhook signature and parse event
    const provider = getPaymentProvider();

    if (provider.name !== providerName) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    const event = await provider.verifyWebhook(request);

    // Idempotency check: skip if order already exists for this provider event
    const { data: existingOrder } = await admin
      .from("orders")
      .select("id")
      .eq("provider", providerName)
      .eq("provider_order_id", event.providerOrderId)
      .single();

    if (existingOrder) {
      // Already processed — return 200 for idempotency
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Process the event
    switch (event.type) {
      case "payment.completed": {
        // Create order
        const { data: order, error: orderError } = await admin
          .from("orders")
          .insert({
            customer_email: event.customerEmail || "unknown",
            product_id: event.productId,
            provider: providerName,
            provider_order_id: event.providerOrderId,
            amount: event.amount,
            currency: event.currency,
            payment_status: "paid",
            provider_payload: event.rawPayload,
            paid_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (orderError || !order) {
          console.error("Failed to create order:", orderError?.message);
          return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
          );
        }

        // Create entitlement
        const { error: entitlementError } = await admin
          .from("download_entitlements")
          .insert({
            order_id: order.id,
            product_id: event.productId,
            user_id: event.customerId || null,
            customer_email: event.customerEmail || null,
            max_downloads: null, // No limit by default
            download_count: 0,
          });

        if (entitlementError) {
          console.error(
            "Failed to create entitlement:",
            entitlementError.message
          );
          // Order exists but entitlement failed — log for manual review
        }

        break;
      }

      case "payment.failed": {
        // Create order with failed status
        await admin.from("orders").insert({
          customer_email: event.customerEmail || "unknown",
          product_id: event.productId,
          provider: providerName,
          provider_order_id: event.providerOrderId,
          amount: event.amount,
          currency: event.currency,
          payment_status: "failed",
          provider_payload: event.rawPayload,
        });
        break;
      }

      case "refund.completed": {
        // Find the order and update status
        const { data: orderToUpdate } = await admin
          .from("orders")
          .select("id")
          .eq("provider", providerName)
          .eq("provider_order_id", event.providerOrderId)
          .single();

        if (orderToUpdate) {
          await admin
            .from("orders")
            .update({
              payment_status: "refunded",
              refunded_at: new Date().toISOString(),
            })
            .eq("id", orderToUpdate.id);

          // Revoke related entitlements
          await admin
            .from("download_entitlements")
            .update({ revoked_at: new Date().toISOString() })
            .eq("order_id", orderToUpdate.id)
            .is("revoked_at", null);
        }
        break;
      }

      case "order.cancelled": {
        const { data: cancelOrder } = await admin
          .from("orders")
          .select("id")
          .eq("provider", providerName)
          .eq("provider_order_id", event.providerOrderId)
          .single();

        if (cancelOrder) {
          await admin
            .from("orders")
            .update({ payment_status: "cancelled" })
            .eq("id", cancelOrder.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
