import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logDatabaseError } from "@/lib/errors/database-error";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("product_id");

  if (!productId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createAdminClient();

  // Get the product to find its external URL
  const { data: product, error } = await supabase
    .from("products")
    .select("external_url, id")
    .eq("id", productId)
    .single();

  if (error || !product) {
    if (error) {
      logDatabaseError("track-click:select", error);
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Validate URL
  let externalUrl: string;
  try {
    const url = new URL(product.external_url);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }
    externalUrl = url.toString();
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Track the click (fire and forget)
  supabase.from("product_clicks").insert({ product_id: productId }).then(({ error: insertError }) => {
    if (insertError) {
      logDatabaseError("track-click:insert", insertError);
    }
  });

  // Redirect to external URL
  return NextResponse.redirect(externalUrl);
}
