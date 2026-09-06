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
 * Get most viewed categories via DB aggregation (not client Map).
 * Uses last 30 days, falls back to categories.view_count if no recent views.
 * Time window is explicit and documented.
 */
export async function getMostViewedCategories(limit = 10, days = 30): Promise<CategoryWithViews[]> {
  const supabase = await createClient();

  // Try RPC aggregation (handles >10k correctly, no limit)
  const { data, error } = await supabase.rpc("get_most_viewed_categories" as never, { p_days: days, p_limit: limit } as never);

  if (!error && data && Array.isArray(data) && data.length > 0) {
    return (data as unknown as CategoryWithViews[]) || [];
  }
  if (error) {
    logDatabaseError("getMostViewedCategories:rpc", error);
  }

  // Fallback to view_count column
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
 * Get most popular search queries via DB GROUP BY (last 30 days).
 */
export async function getPopularSearches(limit = 10, days = 30): Promise<SearchQueryStat[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_popular_searches" as never, { p_days: days, p_limit: limit } as never);

  if (!error && data) {
    return (data as unknown as SearchQueryStat[]) || [];
  }
  if (error) {
    logDatabaseError("getPopularSearches", error);
  }
  return [];
}

/**
 * Get search queries that returned zero results via DB.
 */
export async function getNoResultSearches(limit = 10, days = 30): Promise<SearchQueryStat[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_no_result_searches" as never, { p_days: days, p_limit: limit } as never);

  if (!error && data) {
    return (data as unknown as SearchQueryStat[]) || [];
  }
  if (error) {
    logDatabaseError("getNoResultSearches", error);
  }
  return [];
}

/**
 * Get funnel data via DB SUM (not fetching all rows).
 * Time window: last 30 days for views/clicks if available, otherwise total counters.
 * Returns 0 on error, but caller must not treat 0 as valid if error occurred (see log).
 */
export async function getFunnelData(days = 30): Promise<FunnelData> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_funnel_data" as never, { p_days: days } as never);

  if (!error && data && Array.isArray(data) && data[0]) {
    const row = data[0] as unknown as FunnelData;
    return {
      total_views: Number(row.total_views) || 0,
      total_clicks: Number(row.total_clicks) || 0,
      cta_click_rate: Number(row.cta_click_rate) || 0,
    };
  }
  if (error) {
    logDatabaseError("getFunnelData", error);
  }
  // Fallback to previous method but not treating as zero success - caller should check logs
  const { data: fallback, error: fallbackError } = await supabase.from("products").select("view_count, click_count");
  if (fallbackError) {
    logDatabaseError("getFunnelData:fallback", fallbackError);
    return { total_views: 0, total_clicks: 0, cta_click_rate: 0 };
  }
  const totalViews = (fallback || []).reduce((sum: number, p: { view_count: number }) => sum + (p.view_count || 0), 0);
  const totalClicks = (fallback || []).reduce((sum: number, p: { click_count: number }) => sum + (p.click_count || 0), 0);
  const ctaClickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  return {
    total_views: totalViews,
    total_clicks: totalClicks,
    cta_click_rate: Math.round(ctaClickRate * 10) / 10,
  };
}
