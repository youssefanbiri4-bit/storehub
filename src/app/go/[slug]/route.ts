import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateExternalUrl } from "@/lib/validation/product-delivery";

/**
 * Server-controlled redirect for external-link products.
 * Records the click and redirects to the validated external URL.
 * Prevents open redirects by only redirecting to stored URLs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  // Load product by slug
  const { data: product, error } = await admin
    .from("products")
    .select("id, external_url, delivery_method, status")
    .eq("slug", slug)
    .single();

  if (error || !product) {
    return NextResponse.redirect(new URL("/products", request.url), 302);
  }

  // Must be published
  if (product.status !== "published") {
    return NextResponse.redirect(new URL("/products", request.url), 302);
  }

  // Must be external link delivery
  if (product.delivery_method !== "external_link") {
    return NextResponse.redirect(
      new URL(`/products/${slug}`, request.url),
      302
    );
  }

  // Validate the stored external URL
  if (!product.external_url) {
    return NextResponse.redirect(
      new URL(`/products/${slug}`, request.url),
      302
    );
  }

  const urlValidation = validateExternalUrl(product.external_url);
  if (!urlValidation.valid) {
    return NextResponse.redirect(
      new URL(`/products/${slug}`, request.url),
      302
    );
  }

  // Record the click (fire-and-forget)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || null;

  // Fire-and-forget click tracking
  void (async () => {
    try {
      await admin.from("product_clicks").insert({
        product_id: product.id,
        source: request.nextUrl.searchParams.get("source"),
        medium: request.nextUrl.searchParams.get("medium"),
        campaign: request.nextUrl.searchParams.get("campaign"),
        referrer: request.headers.get("referer") || null,
        user_agent: request.headers.get("user-agent") || null,
        ip_hash: ip ? btoa(ip).slice(0, 16) : null,
      });
      await admin.rpc("increment_click_count" as never, {
        pid: product.id,
      } as never);
    } catch {
      // Don't block redirect
    }
  })();

  // Redirect to the validated external URL
  return NextResponse.redirect(product.external_url, 302);
}
