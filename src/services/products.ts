import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";
import { logDatabaseError } from "@/lib/errors/database-error";

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
    const supabase = await createClient();
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

    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        short_description,
        status,
        base_price_minor,
        compare_at_price_minor,
        currency,
        is_featured,
        published_at,
        category:categories(
          id,
          name,
          slug
        )
      `, { count: "exact" });

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
    if (min_price !== undefined) query = query.gte("base_price_minor", min_price);
    if (max_price !== undefined) query = query.lte("base_price_minor", max_price);

    if (search) {
      const term = search.trim();
      query = query.or(
        `name.ilike.%${term}%,short_description.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}}`,
      );
    }

    switch (sort) {
      case "featured":
        query = query
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });
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
        products: [] as unknown as Product[],
        total: 0,
        page,
        limit,
        totalPages: 0,
        error: { message: "Products could not be loaded.", code: error.code },
      };
    }

    return {
      products: (data || []) as unknown as Product[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      error: null,
    };
  } catch (error: unknown) {
    logDatabaseError("getProducts:unexpected", error);
    return {
      products: [] as unknown as Product[],
      total: 0,
      page: options?.page || 1,
      limit: options?.limit || 12,
      totalPages: 0,
      error: { message: "Products could not be loaded." },
    };
  }
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) return null;
  return data as unknown as Product;
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as Product;
}

export async function getFeaturedProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) return [];
  return (data || []) as unknown as Product[];
}

export async function getLatestProducts(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []) as unknown as Product[];
}

export async function getBestSellingProducts(limit = 4) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []) as unknown as Product[];
}

export async function getSimilarProducts(categoryId: string, excludeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .limit(4);

  if (error) return [];
  return (data || []) as unknown as Product[];
}

export async function incrementViewCount(productId: string) {
  const supabase = await createClient();

  // Insert view record
  const { error: insertError } = await supabase.from("product_views").insert({ product_id: productId });
  if (insertError) {
    logDatabaseError("incrementViewCount:insert", insertError);
  }

  // Increment counter
  const { error: rpcError } = await supabase.rpc("increment_view_count" as never, { pid: productId } as never);
  if (rpcError) {
    logDatabaseError("incrementViewCount:rpc", rpcError);
  }
}

export async function incrementClickCount(productId: string) {
  const supabase = await createClient();

  // Insert click record
  const { error: insertError } = await supabase.from("product_clicks").insert({ product_id: productId });
  if (insertError) {
    logDatabaseError("incrementClickCount:insert", insertError);
  }

  // Increment counter
  const { error: rpcError } = await supabase.rpc("increment_click_count" as never, { pid: productId } as never);
  if (rpcError) {
    logDatabaseError("incrementClickCount:rpc", rpcError);
  }
}

export async function getAllProductsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as unknown as Product[];
}

export async function getAdminStats() {
  const supabase = await createClient();

  const [published, drafts, scheduled, categories, totalViews, totalClicks, brokenLinks, totalDownloads, totalOrders, totalRevenue, totalProducts, outOfStock] =
    await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled"),
      supabase
        .from("categories")
        .select("id", { count: "exact", head: true }),
      supabase.from("products").select("view_count"),
      supabase.from("products").select("click_count"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("link_status", "broken"),
      supabase.from("download_events").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "paid"),
      supabase
        .from("orders")
        .select("amount, currency")
        .eq("payment_status", "paid"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .lte("stock_quantity", 0)
        .eq("is_free", false),
    ]);

  for (const res of [published, drafts, scheduled, categories, totalViews, totalClicks, brokenLinks, totalDownloads, totalOrders, totalRevenue, totalProducts, outOfStock]) {
    if (res.error) {
      logDatabaseError("getAdminStats", res.error);
      break;
    }
  }

  const views = (totalViews.data || []).reduce(
    (sum: number, p: { view_count: number }) => sum + (p.view_count || 0),
    0
  );
  const clicks = (totalClicks.data || []).reduce(
    (sum: number, p: { click_count: number }) => sum + (p.click_count || 0),
    0
  );

  const avgConversion = views > 0 ? (clicks / views) * 100 : 0;

  const { data: topViewed, error: topViewedError } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(5);

  if (topViewedError) {
    logDatabaseError("getAdminStats:topViewed", topViewedError);
  }

  const { data: topClicked, error: topClickedError } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
    .eq("status", "published")
    .order("click_count", { ascending: false })
    .limit(5);

  if (topClickedError) {
    logDatabaseError("getAdminStats:topClicked", topClickedError);
  }

  // Top downloaded products (from download_events)
  const { data: topDownloadedRaw, error: topDownloadedError } = await supabase
    .from("download_events")
    .select("product_id")
    .limit(10000);

  if (topDownloadedError) {
    logDatabaseError("getAdminStats:topDownloaded", topDownloadedError);
  }

  // Aggregate downloads by product
  const downloadCounts = new Map<string, number>();
  for (const event of topDownloadedRaw || []) {
    const pid = event.product_id;
    downloadCounts.set(pid, (downloadCounts.get(pid) || 0) + 1);
  }

  // Sort and get top 5 product IDs
  const topProductIds = [...downloadCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topDownloaded: Product[] = [];
  if (topProductIds.length > 0) {
    const { data: topProducts } = await supabase
      .from("products")
      .select(`
      id,
      name,
      slug,
      short_description,
      status,
      base_price_minor,
      compare_at_price_minor,
      currency,
      is_featured,
      published_at,
      category:categories(
        id,
        name,
        slug
      )
    `)
      .in("id", topProductIds);

    // Preserve sort order
    const productMap = new Map((topProducts || []).map((p) => [p.id, p]));
    topDownloaded = topProductIds
      .map((id) => productMap.get(id))
      .filter(Boolean) as unknown as Product[];
  }

  const revenue = (totalRevenue.data || []).reduce(
    (sum: number, o: { amount: number }) => sum + (o.amount || 0),
    0
  );

  return {
    published_count: published.count || 0,
    draft_count: drafts.count || 0,
    scheduled_count: scheduled.count || 0,
    unpublished_count: (drafts.count || 0) + (scheduled.count || 0),
    categories_count: categories.count || 0,
    total_views: views,
    total_clicks: clicks,
    broken_links_count: brokenLinks.count || 0,
    avg_conversion: avgConversion,
    total_downloads: totalDownloads.count || 0,
    total_orders: totalOrders.count || 0,
    total_revenue: revenue,
    top_viewed: (topViewed || []) as unknown as Product[],
    top_clicked: (topClicked || []) as unknown as Product[],
    top_downloaded: topDownloaded,
    total_products: totalProducts.count || 0,
    out_of_stock_count: outOfStock.count || 0,
  };
}
