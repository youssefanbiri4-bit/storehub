import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Coupon } from "@/types";

export async function getCoupons(options?: {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const { search, is_active, page = 1, limit = 20 } = options || {};

  let query = supabase
    .from("coupons")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (is_active !== undefined) {
    query = query.eq("is_active", is_active);
  }
  if (search) {
    const term = search.replace(/[%",()]/g, " ").replace(/\s+/g, " ").trim();
    if (term.length >= 2) {
      query = query.or(`code.ilike.%${term}%,description.ilike.%${term}%`);
    }
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return {
      coupons: [] as Coupon[],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: { message: "Failed to load coupons" },
    };
  }

  return {
    coupons: (data ?? []) as Coupon[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    error: null,
  };
}
