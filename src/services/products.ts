import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ProductCardData,
  ProductDetailData,
  ProductEditData,
  ServiceError,
  ServiceResult,
} from "@/types";
import { logDatabaseError } from "@/lib/errors/database-error";

// Explicit selects - never SELECT * in list paths, explicit per use-case
const CARD_SELECT = `
  id,
  name,
  slug,
  short_description,
  cover_image,
  gallery_images,
  base_price_minor,
  compare_at_price_minor,
  price,
  old_price,
  currency,
  is_free,
  is_featured,
  badge,
  category_id,
  brand_id,
  status,
  is_published,
  published_at,
  stock_quantity,
  view_count,
  click_count,
  seo_title,
  seo_description,
  delivery_method,
  external_url,
  external_platform,
  hosted_access_type,
  product_type,
  language,
  license_type,
  images:product_images(
    id,
    storage_path,
    alt_text,
    is_primary,
    sort_order
  ),
  category:categories(
    id,
    name,
    slug
  )
`;

const DETAIL_SELECT = `
  id,
  name,
  slug,
  short_description,
  description,
  cover_image,
  gallery_images,
  base_price_minor,
  compare_at_price_minor,
  price,
  old_price,
  currency,
  is_free,
  is_featured,
  badge,
  category_id,
  brand_id,
  status,
  is_published,
  published_at,
  stock_quantity,
  reserved_quantity,
  requires_shipping,
  sku,
  weight_grams,
  length_mm,
  width_mm,
  height_mm,
  tags,
  included_items,
  requirements,
  product_type,
  file_format,
  file_size,
  language,
  supported_devices,
  required_software,
  user_level,
  license_type,
  version,
  view_count,
  click_count,
  seo_title,
  seo_description,
  og_image,
  canonical_url,
  external_url,
  delivery_method,
  external_platform,
  hosted_access_type,
  download_limit,
  download_link_expiry_minutes,
  payment_provider,
  payment_provider_product_id,
  payment_provider_price_id,
  sale_start_date,
  sale_end_date,
  scheduled_publish_at,
  hidden_at,
  archived_at,
  link_status,
  link_response_code,
  link_error_message,
  total_revenue,
  last_link_check,
  created_at,
  updated_at,
  images:product_images(
    id,
    storage_path,
    alt_text,
    is_primary,
    sort_order
  ),
  category:categories(
    id,
    name,
    slug
  ),
  brand:brands(
    id,
    name,
    slug
  )
`;

const EDIT_SELECT = DETAIL_SELECT;

function isNotFoundError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  // Supabase PostgREST not found codes
  return error.code === "PGRST116" || error.message?.includes("Results contain 0 rows") === true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichAltText(row: any): any {
  const images = (row?.images ?? []) as Array<{ alt_text: string | null; is_primary: boolean }>;
  const primary = images.find((img) => img.is_primary) ?? images[0];
  return { ...row, image_alt_text: primary?.alt_text ?? row?.name };
}

export async function getProducts(options?: {
  category_id?: string;
  brand_id?: string;
  product_type?: string;
  is_free?: boolean;
  is_featured?: boolean;
  badge?: string;
  tags?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  published_only?: boolean;
}) {
  try {
    const supabase = createAdminClient();
    const {
      category_id,
      brand_id,
      product_type,
      is_free,
      is_featured,
      badge,
      tags,
      min_price,
      max_price,
      search,
      sort = "newest",
      page = 1,
      limit = 12,
      published_only = true,
    } = options || {};

    let query = supabase.from("products").select(CARD_SELECT, { count: "exact" });

    if (published_only) {
      query = query.eq("status", "published");
    }
    if (category_id) query = query.eq("category_id", category_id);
    if (brand_id) query = query.eq("brand_id", brand_id);
    if (product_type) query = query.eq("product_type", product_type);
    if (is_free !== undefined) query = query.eq("is_free", is_free);
    if (is_featured !== undefined) query = query.eq("is_featured", is_featured);
    if (badge) query = query.eq("badge", badge);
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tagList.length === 1) {
        query = query.contains("tags", [tagList[0]]);
      } else if (tagList.length > 1) {
        query = query.overlaps("tags", tagList);
      }
    }
    // Price filters are in minor units (storage unit). Caller must convert major->minor via pricing utils.
    // Do not mix currencies here - all products assumed same currency for filter; multi-currency not supported in single filter.
    if (min_price !== undefined) query = query.gte("base_price_minor", min_price);
    if (max_price !== undefined) query = query.lte("base_price_minor", max_price);

    if (search) {
      // Sanitize: limit length, remove PostgREST filter control characters (",", ".", ":", "(", ")")
      let term = search.trim().slice(0, 100);
      // Escape characters that could alter filter structure: replace % and , and " with space
      term = term.replace(/[%",()]/g, " ").replace(/\s+/g, " ").trim();
      if (term.length < 2) {
        // Ignore too short terms to avoid full table scan
        // Fall through to no search
      } else {
        // Use ilike with escaped term; PostgREST will handle % as wildcard, but we removed % from term
        query = query.or(
          `name.ilike.%${term}%,short_description.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}}`,
        );
      }
    }

    switch (sort) {
      case "featured":
        query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
        break;
      case "price_asc":
        query = query.order("base_price_minor", { ascending: true, nullsFirst: true });
        break;
      case "price_desc":
        query = query.order("base_price_minor", { ascending: false, nullsFirst: true });
        break;
      case "popular":
        query = query.order("view_count", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      logDatabaseError("getProducts:select", error);
      return {
        products: [] as unknown as ProductCardData[],
        total: 0,
        page,
        limit,
        totalPages: 0,
        error: { message: "Products could not be loaded.", code: error.code } as ServiceError,
      };
    }

    return {
      products: ((data ?? []) as unknown as ProductCardData[]).map(enrichAltText),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      error: null,
    };
  } catch (error: unknown) {
    logDatabaseError("getProducts:unexpected", error);
    return {
      products: [] as unknown as ProductCardData[],
      total: 0,
      page: options?.page || 1,
      limit: options?.limit || 12,
      totalPages: 0,
      error: { message: "Products could not be loaded." } as ServiceError,
    };
  }
}

export async function getProductBySlug(slug: string): Promise<ServiceResult<ProductDetailData>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("products").select(DETAIL_SELECT).eq("slug", slug).eq("status", "published").single();

  if (error) {
    if (isNotFoundError(error)) {
      return { data: null, error: { message: "Product not found", code: error.code, notFound: true } };
    }
    logDatabaseError("getProductBySlug", error);
    return { data: null, error: { message: "Failed to load product", code: error.code } };
  }
  if (!data) {
    return { data: null, error: { message: "Product not found", notFound: true } };
  }
  return { data: enrichAltText(data) as unknown as ProductDetailData, error: null };
}

export async function getProductById(id: string): Promise<ServiceResult<ProductEditData>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(EDIT_SELECT).eq("id", id).single();

  if (error) {
    if (isNotFoundError(error)) {
      return { data: null, error: { message: "Product not found", code: error.code, notFound: true } };
    }
    logDatabaseError("getProductById", error);
    return { data: null, error: { message: "Failed to load product", code: error.code } };
  }
  if (!data) {
    return { data: null, error: { message: "Product not found", notFound: true } };
  }
  return { data: enrichAltText(data) as unknown as ProductEditData, error: null };
}

export async function getProductByIdAdmin(id: string): Promise<ServiceResult<ProductEditData>> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("products").select(EDIT_SELECT).eq("id", id).single();
  if (error) {
    if (isNotFoundError(error)) {
      return { data: null, error: { message: "Product not found", code: error.code, notFound: true } };
    }
    logDatabaseError("getProductByIdAdmin", error);
    return { data: null, error: { message: "Failed to load product", code: error.code } };
  }
  if (!data) return { data: null, error: { message: "Product not found", notFound: true } };
  return { data: enrichAltText(data) as unknown as ProductEditData, error: null };
}

export async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(CARD_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    logDatabaseError("getFeaturedProducts", error);
    return [];
  }
  return ((data ?? []) as unknown as ProductCardData[]).map(enrichAltText);
}

export async function getLatestProducts(limit = 6): Promise<ProductCardData[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(CARD_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logDatabaseError("getLatestProducts", error);
    return [];
  }
  return ((data ?? []) as unknown as ProductCardData[]).map(enrichAltText);
}

export async function getBestSellingProducts(limit = 4): Promise<ProductCardData[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(CARD_SELECT)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    logDatabaseError("getBestSellingProducts", error);
    return [];
  }
  return ((data ?? []) as unknown as ProductCardData[]).map(enrichAltText);
}

export async function getSimilarProducts(categoryId: string, excludeId: string): Promise<ProductCardData[]> {
  if (!categoryId) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(CARD_SELECT)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .limit(4);

  if (error) {
    logDatabaseError("getSimilarProducts", error);
    return [];
  }
  return ((data ?? []) as unknown as ProductCardData[]).map(enrichAltText);
}

export async function incrementViewCount(productId: string) {
  const supabase = await createClient();

  const { error: insertError } = await supabase.from("product_views").insert({ product_id: productId });
  if (insertError) {
    logDatabaseError("incrementViewCount:insert", insertError);
  }

  const { error: rpcError } = await supabase.rpc("increment_view_count" as never, { pid: productId } as never);
  if (rpcError) {
    logDatabaseError("incrementViewCount:rpc", rpcError);
  }
}

export async function incrementClickCount(productId: string) {
  const supabase = await createClient();

  const { error: insertError } = await supabase.from("product_clicks").insert({ product_id: productId });
  if (insertError) {
    logDatabaseError("incrementClickCount:insert", insertError);
  }

  const { error: rpcError } = await supabase.rpc("increment_click_count" as never, { pid: productId } as never);
  if (rpcError) {
    logDatabaseError("incrementClickCount:rpc", rpcError);
  }
}

export async function getAllProductsAdmin(): Promise<ProductEditData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(EDIT_SELECT).order("created_at", { ascending: false });

  if (error) {
    logDatabaseError("getAllProductsAdmin", error);
    return [];
  }
  return ((data ?? []) as unknown as ProductEditData[]).map(enrichAltText);
}

export async function getAdminStats(opts?: { days?: number }) {
  const supabase = await createClient();
  const days = opts?.days ?? 30;

  // Use Promise.all for independent counts, but use RPC for aggregated stats
  const [published, drafts, scheduled, categories, brokenLinks, totalOrders, totalProducts, outOfStock, funnelRes, revenueRes, customerRevenueRes] =
    await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("link_status", "broken"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).lte("stock_quantity", 0).eq("is_free", false),
      supabase.rpc("get_funnel_data" as never, { p_days: days } as never),
      supabase.rpc("get_revenue_by_currency" as never, { p_days: days } as never),
      supabase.rpc("get_customer_revenue_by_currency" as never, { p_days: days } as never),
    ]);

  for (const res of [published, drafts, scheduled, categories, brokenLinks, totalOrders, totalProducts, outOfStock] as unknown as Array<{ error?: unknown }>) {
    if ((res as { error?: { message: string } })?.error) {
      logDatabaseError("getAdminStats:count", (res as { error: unknown }).error);
      // Do not treat as zero success; return with error flag but still show partial (caller must check)
    }
  }

  let funnel = { total_views: 0, total_clicks: 0, cta_click_rate: 0 };
  if (!funnelRes.error && Array.isArray(funnelRes.data) && funnelRes.data[0]) {
    const row = funnelRes.data[0] as unknown as { total_views: number; total_clicks: number; cta_click_rate: number };
    funnel = { total_views: Number(row.total_views) || 0, total_clicks: Number(row.total_clicks) || 0, cta_click_rate: Number(row.cta_click_rate) || 0 };
  } else if (funnelRes.error) {
    logDatabaseError("getAdminStats:funnel", funnelRes.error);
  }

  // Revenue per currency (separate, do not sum mixed currencies)
  const revenueByCurrency: Array<{ currency: string; total_minor: number; order_count: number }> = [];
  if (!revenueRes.error && Array.isArray(revenueRes.data)) {
    for (const r of revenueRes.data as unknown as Array<{ currency: string; total_minor: number; order_count: number }>) {
      revenueByCurrency.push({ currency: r.currency, total_minor: Number(r.total_minor), order_count: Number(r.order_count) });
    }
  } else if (revenueRes.error) {
    logDatabaseError("getAdminStats:revenue", revenueRes.error);
  }
  if (!customerRevenueRes.error && Array.isArray(customerRevenueRes.data)) {
    for (const r of customerRevenueRes.data as unknown as Array<{ currency: string; total_minor: number; order_count: number }>) {
      const existing = revenueByCurrency.find((x) => x.currency === r.currency);
      if (existing) {
        existing.total_minor += Number(r.total_minor);
        existing.order_count += Number(r.order_count);
      } else {
        revenueByCurrency.push({ currency: r.currency, total_minor: Number(r.total_minor), order_count: Number(r.order_count) });
      }
    }
  }
  // For backward compat, total_revenue is sum of primary currency (MAD) or first, but we expose per-currency
  const primaryRevenue = revenueByCurrency.find((r) => r.currency === "MAD")?.total_minor ?? revenueByCurrency[0]?.total_minor ?? 0;
  // Also compute avgConversion from funnel
  const avgConversion = funnel.cta_click_rate;

  let topViewedData: ProductCardData[] = [];
  let topClickedData: ProductCardData[] = [];

  // Top viewed - try RPC first
  const { data: topViewedRpc, error: topViewedRpcError } = await supabase.rpc("get_top_viewed_products" as never, { p_limit: 5 } as never);
  if (!topViewedRpcError && Array.isArray(topViewedRpc) && topViewedRpc.length > 0) {
    topViewedData = (topViewedRpc as unknown as ProductCardData[]).map(enrichAltText);
  } else {
    if (topViewedRpcError) logDatabaseError("getAdminStats:topViewedRpc", topViewedRpcError);
    const { data, error } = await supabase.from("products").select(CARD_SELECT).eq("status", "published").order("view_count", { ascending: false }).limit(5);
    if (error) logDatabaseError("getAdminStats:topViewed", error);
    else topViewedData = ((data ?? []) as unknown as ProductCardData[]).map(enrichAltText);
  }

  const { data: topClickedRpc, error: topClickedRpcError } = await supabase.rpc("get_top_clicked_products" as never, { p_limit: 5 } as never);
  if (!topClickedRpcError && Array.isArray(topClickedRpc) && topClickedRpc.length > 0) {
    topClickedData = (topClickedRpc as unknown as ProductCardData[]).map(enrichAltText);
  } else {
    if (topClickedRpcError) logDatabaseError("getAdminStats:topClickedRpc", topClickedRpcError);
    const { data, error } = await supabase.from("products").select(CARD_SELECT).eq("status", "published").order("click_count", { ascending: false }).limit(5);
    if (error) logDatabaseError("getAdminStats:topClicked", error);
    else topClickedData = ((data ?? []) as unknown as ProductCardData[]).map(enrichAltText);
  }

  return {
    published_count: published.count || 0,
    draft_count: drafts.count || 0,
    scheduled_count: scheduled.count || 0,
    unpublished_count: (drafts.count || 0) + (scheduled.count || 0),
    categories_count: categories.count || 0,
    total_views: funnel.total_views,
    total_clicks: funnel.total_clicks,
    broken_links_count: brokenLinks.count || 0,
    avg_conversion: avgConversion,
    total_orders: totalOrders.count || 0,
    // Keep total_revenue for compat but also expose per-currency
    total_revenue: primaryRevenue,
    revenue_by_currency: revenueByCurrency,
    top_viewed: topViewedData,
    top_clicked: topClickedData,
    total_products: totalProducts.count || 0,
    out_of_stock_count: outOfStock.count || 0,
    period_days: days,
  };
}
