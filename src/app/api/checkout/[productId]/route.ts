import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments/provider";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const admin = createAdminClient();

  // Load product
  const { data: product, error } = await admin
    .from("products")
    .select("id, name, price, currency, delivery_method, hosted_access_type, status")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return NextResponse.json(
      { error: "Product not found." },
      { status: 404 }
    );
  }

  if (product.status !== "published") {
    return NextResponse.json(
      { error: "This product is not currently available." },
      { status: 403 }
    );
  }

  if (product.delivery_method !== "hosted_file") {
    return NextResponse.json(
      { error: "This product uses external checkout." },
      { status: 400 }
    );
  }

  if (product.hosted_access_type !== "paid") {
    return NextResponse.json(
      { error: "This product is free." },
      { status: 400 }
    );
  }

  if (product.price <= 0) {
    return NextResponse.json(
      { error: "Invalid product price." },
      { status: 400 }
    );
  }

  // Get customer info from request body
  let customerEmail: string | undefined;
  try {
    const body = await request.json();
    customerEmail = body.customerEmail;
  } catch {
    // No body or invalid JSON
  }

  try {
    const provider = getPaymentProvider();
    const result = await provider.createCheckoutSession({
      productId: product.id,
      productName: product.name,
      price: product.price,
      currency: product.currency,
      customerEmail,
      successUrl: `${APP_URL}/products?purchase=success`,
      cancelUrl: `${APP_URL}/products/${productId}?purchase=cancelled`,
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      providerSessionId: result.providerSessionId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
