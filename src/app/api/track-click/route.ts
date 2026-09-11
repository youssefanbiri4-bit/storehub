import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logDatabaseError } from "@/lib/errors/database-error";
import { validateExternalUrl } from "@/lib/utils/url-validation";
import { hashIp } from "@/lib/utils/ip-hash";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("product_id");

  if (!productId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createAdminClient();

  // Get the product to find its external URL and verify it is published + external_link
  const { data: product, error } = await supabase
    .from("products")
    .select("external_url, id, status, delivery_method")
    .eq("id", productId)
    .single();

  if (error || !product) {
    if (error) {
      logDatabaseError("track-click:select", error);
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unified validation: must be published and external_link
  if (product.status !== "published" || product.delivery_method !== "external_link") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!product.external_url) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const urlValidation = validateExternalUrl(product.external_url);
  if (!urlValidation.valid) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const externalUrl = product.external_url;

  // Track the click (fire and forget) with privacy-safe IP hash
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || null;
  const ipHash = ip ? hashIp(ip) : null;

  // Use waitUntil-like fire-and-forget without blocking redirect
  void (async () => {
    try {
      await supabase.from("product_clicks").insert({
        product_id: productId,
        source: request.nextUrl.searchParams.get("source"),
        medium: request.nextUrl.searchParams.get("medium"),
        campaign: request.nextUrl.searchParams.get("campaign"),
        referrer: request.headers.get("referer") || null,
        user_agent: request.headers.get("user-agent") || null,
        ip_hash: ipHash,
      });
      await supabase.rpc("increment_click_count" as never, { pid: productId } as never);
    } catch {
      // do not block redirect
    }
  })();

  // Redirect to external URL
  return NextResponse.redirect(externalUrl);
}
