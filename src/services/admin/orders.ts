import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CustomerOrder, OrderItem } from "@/types";

export interface OrderWithDetails extends CustomerOrder {
  items?: OrderItem[];
  profiles?: { full_name: string | null } | null;
}

export async function getOrders(options?: {
  status?: string;
  payment_status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const { status, payment_status, search, page = 1, limit = 20 } = options || {};

  let query = supabase
    .from("customer_orders")
    .select(
      `*,
       items:order_items(*),
       profiles!customer_orders_user_id_fkey(full_name)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (payment_status && payment_status !== "all") {
    query = query.eq("payment_status", payment_status);
  }
  if (search) {
    const term = search.replace(/[%",()]/g, " ").replace(/\s+/g, " ").trim();
    if (term.length >= 2) {
      query = query.or(
        `order_number.ilike.%${term}%,customer_email.ilike.%${term}%`
      );
    }
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return {
      orders: [] as OrderWithDetails[],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: { message: "Failed to load orders" },
    };
  }

  return {
    orders: (data ?? []) as unknown as OrderWithDetails[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    error: null,
  };
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_orders")
    .select(
      `*,
       items:order_items(*),
       shipments(*),
       payments(*),
       profiles!customer_orders_user_id_fkey(full_name, phone)`
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as OrderWithDetails;
}
