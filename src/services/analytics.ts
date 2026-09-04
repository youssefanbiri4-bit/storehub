import { createClient } from "@/lib/supabase/server";
import { logDatabaseError } from "@/lib/errors/database-error";

export interface CategoryWithViews {
  id: string;
  name: string;
  slug: string;
  view_count: number;
}

export interface SearchQueryStat {
  query: string;
  count: number;
}

export interface FunnelData {
  total_views: number;
  total_clicks: number;
  cta_click_rate: number;
}

/**
 * Get most viewed categories by aggregating category_views table.
 * Falls back to category.view_count if category_views has no data.
 */
export async function getMostViewedCategories(limit = 10): Promise<CategoryWithViews[]> {
  const supabase = await createClient();

  // Try aggregating from category_views first
  const { data: views, error: viewsError } = await supabase
    .from("category_views")
    .select("category_id")
    .limit(10000);

  if (viewsError) {
    logDatabaseError("getMostViewedCategories:views", viewsError);
  }

  if (views && views.length > 0) {
    // Count views per category
    const counts = new Map<string, number>();
    for (const v of views) {
      const cid = v.category_id as string;
      counts.set(cid, (counts.get(cid) || 0) + 1);
    }

    const topIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (topIds.length > 0) {
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name, slug, view_count")
        .in("id", topIds);

      if (categories) {
        const catMap = new Map(categories.map((c) => [c.id, c]));
        return topIds
          .map((id) => {
            const cat = catMap.get(id);
            return cat ? { ...cat, view_count: counts.get(id) || 0 } : null;
          })
          .filter(Boolean) as CategoryWithViews[];
      }
    }
  }

  // Fallback: use the view_count column on categories
  const { data: fallback, error: fallbackError } = await supabase
    .from("categories")
    .select("id, name, slug, view_count")
    .order("view_count", { ascending: false })
    .limit(limit);

  if (fallbackError) {
    logDatabaseError("getMostViewedCategories:fallback", fallbackError);
    return [];
  }

  return (fallback || []) as CategoryWithViews[];
}

/**
 * Get most popular search queries.
 */
export async function getPopularSearches(limit = 10): Promise<SearchQueryStat[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("search_queries")
    .select("query")
    .limit(10000);

  if (error) {
    logDatabaseError("getPopularSearches", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Aggregate by query (case-insensitive)
  const counts = new Map<string, number>();
  for (const row of data) {
    const q = (row.query as string).toLowerCase().trim();
    if (q) counts.set(q, (counts.get(q) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));
}

/**
 * Get search queries that returned zero results.
 */
export async function getNoResultSearches(limit = 10): Promise<SearchQueryStat[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("search_queries")
    .select("query, result_count")
    .eq("result_count", 0)
    .limit(10000);

  if (error) {
    logDatabaseError("getNoResultSearches", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Aggregate by query
  const counts = new Map<string, number>();
  for (const row of data) {
    const q = (row.query as string).toLowerCase().trim();
    if (q) counts.set(q, (counts.get(q) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));
}

/**
 * Get funnel data: product views → CTA clicks → click rate.
 * Uses the aggregate counters on the products table.
 */
export async function getFunnelData(): Promise<FunnelData> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("view_count, click_count");

  if (error) {
    logDatabaseError("getFunnelData", error);
    return { total_views: 0, total_clicks: 0, cta_click_rate: 0 };
  }

  const totalViews = (data || []).reduce(
    (sum: number, p: { view_count: number }) => sum + (p.view_count || 0),
    0
  );
  const totalClicks = (data || []).reduce(
    (sum: number, p: { click_count: number }) => sum + (p.click_count || 0),
    0
  );

  const ctaClickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  return {
    total_views: totalViews,
    total_clicks: totalClicks,
    cta_click_rate: Math.round(ctaClickRate * 10) / 10,
  };
}
