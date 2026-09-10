import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CustomerWithStats {
  id: string;
  full_name: string | null;
  email?: string;
  phone?: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
}

export async function getCustomers(options?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const { search, page = 1, limit = 20 } = options || {};

  // Get profiles with order counts
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    const term = search.replace(/[%",()]/g, " ").replace(/\s+/g, " ").trim();
    if (term.length >= 2) {
      query = query.or(`full_name.ilike.%${term}%`);
    }
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: profiles, error, count } = await query;

  if (error || !profiles) {
    return {
      customers: [] as CustomerWithStats[],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: { message: "Failed to load customers" },
    };
  }

  // Get order stats for each customer
  const customersWithStats: CustomerWithStats[] = [];
  for (const profile of profiles) {
    const { data: orders } = await supabase
      .from("customer_orders")
      .select("total_minor, created_at, payment_status")
      .eq("user_id", profile.id)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false });

    const orderCount = orders?.length || 0;
    const totalSpent = (orders ?? []).reduce(
      (sum: number, o: { total_minor: number }) => sum + (o.total_minor || 0),
      0
    );
    const lastOrderDate = orders?.[0]?.created_at || null;

    customersWithStats.push({
      id: profile.id,
      full_name: profile.full_name,
      phone: profile.phone,
      created_at: profile.created_at,
      order_count: orderCount,
      total_spent: totalSpent,
      last_order_date: lastOrderDate,
    });
  }

  return {
    customers: customersWithStats,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    error: null,
  };
}
