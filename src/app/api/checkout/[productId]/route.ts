import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments/provider";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  // Require authenticated user for checkout (bind to identity)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = createAdminClient();

  // Load product with both price systems (handle zero as valid) and physical flags
  const { data: product, error } = await admin
    .from("products")
    .select("id, name, price, base_price_minor, currency, delivery_method, hosted_access_type, status, requires_shipping, stock_quantity")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  if (product.status !== "published") {
    return NextResponse.json({ error: "This product is not currently available." }, { status: 403 });
  }

  // Determine if this is digital paid or physical (both require payment)
  const isDigitalPaid = product.delivery_method === "hosted_file" && product.hosted_access_type === "paid";
  const isPhysical = product.requires_shipping || (product.stock_quantity !== null && product.stock_quantity !== undefined);
  // For both digital and physical, if is_free or hosted free, no checkout needed
  if (!isDigitalPaid && !isPhysical) {
    // Check if product is free digital
    if (product.hosted_access_type === "free") {
      return NextResponse.json({ error: "This product is free." }, { status: 400 });
    }
    // If not digital paid and not physical, maybe external link
    if (product.delivery_method === "external_link") {
      return NextResponse.json({ error: "This product uses external checkout." }, { status: 400 });
    }
  }

  // Resolve price: prefer base_price_minor (minor units) else legacy price; zero is valid for free check above
  const resolvedPrice = typeof product.base_price_minor === "number" && product.base_price_minor !== null ? product.base_price_minor / 100 : product.price;
  const resolvedPriceMinor = typeof product.base_price_minor === "number" && product.base_price_minor !== null ? product.base_price_minor : Math.round((product.price || 0) * 100);

  if (resolvedPriceMinor <= 0) {
    return NextResponse.json({ error: "Invalid product price." }, { status: 400 });
  }

  // Use authenticated user's email (do not trust client-provided email)
  const customerEmail = user.email || undefined;
  const customerId = user.id;

  // Check for existing pending checkout attempt for idempotency (same user+product within 10m)
  const { data: existingPending } = await admin
    .from("checkout_attempts")
    .select("id, provider_session_id, created_at")
    .eq("user_id", customerId)
    .eq("product_id", productId)
    .eq("status", "pending")
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If we have a recent pending attempt with a session, we could return it, but Stripe URL expires.
  // For now, create a new attempt each time but keep idempotency via DB unique on provider_session_id.
  // Insert pending attempt
  const { data: attempt, error: attemptError } = await admin
    .from("checkout_attempts")
    .insert({
      user_id: customerId,
      product_id: productId,
      provider: getPaymentProvider().name,
      amount_minor: resolvedPriceMinor,
      currency: product.currency,
      status: "pending",
      metadata: { isDigitalPaid, isPhysical },
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    // If duplicate due to concurrent, fetch existing
    if (attemptError?.code === "23505") {
      return NextResponse.json({ error: "Checkout already in progress. Please wait." }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to create checkout attempt." }, { status: 500 });
  }

  try {
    const provider = getPaymentProvider();
    const isPhysicalFlag = !!isPhysical;
    const result = await provider.createCheckoutSession({
      productId: product.id,
      productName: product.name,
      price: resolvedPrice,
      amountMinor: resolvedPriceMinor,
      currency: product.currency,
      customerId,
      customerEmail,
      successUrl: `${APP_URL}/account/downloads?checkout=success`,
      cancelUrl: `${APP_URL}/products/${productId}?checkout=cancelled`,
      attemptId: attempt.id,
      isPhysical: isPhysicalFlag,
    });

    // Update attempt with provider session id
    await admin.from("checkout_attempts").update({ provider_session_id: result.providerSessionId }).eq("id", attempt.id);

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      providerSessionId: result.providerSessionId,
      attemptId: attempt.id,
    });
  } catch (error) {
    // Mark attempt as failed
    await admin.from("checkout_attempts").update({ status: "failed" }).eq("id", attempt.id);
    const message = error instanceof Error ? error.message : "Checkout creation failed";
    // Do not expose internal stripe secrets; return generic for not configured
    if (message.includes("not configured") || message.includes("not implemented")) {
      return NextResponse.json({ error: "Payment is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
