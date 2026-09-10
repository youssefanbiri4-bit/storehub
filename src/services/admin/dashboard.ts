import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerOrder, Product } from "@/types";

export interface DashboardKpis {
  totalRevenue: number;
  totalRevenueChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  totalCustomers: number;
  totalCustomersChange: number;
  conversionRate: number;
  conversionRateChange: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_email: string;
  total_minor: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  stock_quantity: number;
  cover_image: string | null;
  currency: string;
  base_price_minor: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  revenueChart: RevenuePoint[];
  recentOrders: RecentOrder[];
  topProducts: Product[];
  lowStockProducts: LowStockProduct[];
  pendingOrders: number;
  unpaidOrders: number;
  brokenLinks: number;
}

function daysAgo(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const now = new Date();
  const thisPeriodStart = daysAgo(now, 30).toISOString();
  const prevPeriodStart = daysAgo(now, 60).toISOString();

  // KPIs: current period vs previous period
  const [
    thisPeriodOrders,
    prevPeriodOrders,
    thisPeriodRevenue,
    prevPeriodRevenue,
    totalCustomers,
    prevCustomers,
    funnelRes,
    lowStockRes,
    pendingOrdersRes,
    unpaidOrdersRes,
    brokenLinksRes,
    recentOrdersRes,
    topProductsRes,
    revenueChartRes,
  ] = await Promise.all([
    // Current period orders
    supabase
      .from("customer_orders")
      .select("id, total_minor", { count: "exact" })
      .gte("created_at", thisPeriodStart),
    // Previous period orders
    supabase
      .from("customer_orders")
      .select("id, total_minor", { count: "exact" })
      .gte("created_at", prevPeriodStart)
      .lt("created_at", thisPeriodStart),
    // Current period revenue
    supabase
      .from("customer_orders")
      .select("total_minor")
      .gte("created_at", thisPeriodStart)
      .eq("payment_status", "paid"),
    // Previous period revenue
    supabase
      .from("customer_orders")
      .select("total_minor")
      .gte("created_at", prevPeriodStart)
      .lt("created_at", thisPeriodStart)
      .eq("payment_status", "paid"),
    // Total customers (all time)
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    // Previous period customers
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .lte("created_at", thisPeriodStart),
    // Funnel for conversion
    supabase.rpc("get_funnel_data" as never, { p_days: 30 } as never),
    // Low stock products
    supabase
      .from("products")
      .select("id, name, slug, stock_quantity, cover_image, currency, base_price_minor")
      .eq("is_free", false)
      .gt("stock_quantity", 0)
      .lte("stock_quantity", 5)
      .eq("status", "published")
      .order("stock_quantity", { ascending: true })
      .limit(5),
    // Pending orders count
    supabase
      .from("customer_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_payment", "pending_confirmation"]),
    // Unpaid orders count
    supabase
      .from("customer_orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "unpaid"),
    // Broken links count
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("link_status", "broken"),
    // Recent orders (last 5)
    supabase
      .from("customer_orders")
      .select("id, order_number, customer_email, total_minor, currency, status, payment_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    // Top products by revenue
    supabase
      .from("products")
      .select("id, name, slug, cover_image, total_revenue, view_count, click_count, base_price_minor, currency, status")
      .eq("status", "published")
      .order("total_revenue", { ascending: false })
      .limit(5),
    // Revenue chart data (last 30 days, grouped by day)
    supabase
      .from("customer_orders")
      .select("created_at, total_minor")
      .gte("created_at", thisPeriodStart)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: true }),
  ]);

  // Process KPIs
  const thisRevenue = (thisPeriodRevenue.data ?? []).reduce(
    (sum: number, o: { total_minor: number }) => sum + (o.total_minor || 0),
    0
  );
  const prevRevenue = (prevPeriodRevenue.data ?? []).reduce(
    (sum: number, o: { total_minor: number }) => sum + (o.total_minor || 0),
    0
  );
  const thisOrderCount = thisPeriodOrders.count || 0;
  const prevOrderCount = prevPeriodOrders.count || 0;
  const totalCust = totalCustomers.count || 0;
  const prevCustCount = prevCustomers.count || 0;

  const revenueChange = prevRevenue > 0 ? Math.round(((thisRevenue - prevRevenue) / prevRevenue) * 100) : 0;
  const ordersChange = prevOrderCount > 0 ? Math.round(((thisOrderCount - prevOrderCount) / prevOrderCount) * 100) : 0;
  const customersChange = prevCustCount > 0 ? Math.round(((totalCust - prevCustCount) / prevCustCount) * 100) : 0;

  let conversionRate = 0;
  if (!funnelRes.error && Array.isArray(funnelRes.data) && funnelRes.data[0]) {
    const row = funnelRes.data[0] as { cta_click_rate: number };
    conversionRate = Number(row.cta_click_rate) || 0;
  }

  // Process revenue chart
  const revenueByDay = new Map<string, number>();
  for (const order of (revenueChartRes.data ?? []) as Array<{ created_at: string; total_minor: number }>) {
    const day = order.created_at.slice(0, 10);
    revenueByDay.set(day, (revenueByDay.get(day) || 0) + (order.total_minor || 0));
  }
  const revenueChart: RevenuePoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(now, i);
    const key = d.toISOString().slice(0, 10);
    revenueChart.push({ date: key, revenue: revenueByDay.get(key) || 0 });
  }

  return {
    kpis: {
      totalRevenue: thisRevenue,
      totalRevenueChange: revenueChange,
      totalOrders: thisOrderCount,
      totalOrdersChange: ordersChange,
      totalCustomers: totalCust,
      totalCustomersChange: customersChange,
      conversionRate,
      conversionRateChange: 0,
    },
    revenueChart,
    recentOrders: (recentOrdersRes.data ?? []) as unknown as RecentOrder[],
    topProducts: (topProductsRes.data ?? []) as unknown as Product[],
    lowStockProducts: (lowStockRes.data ?? []) as unknown as LowStockProduct[],
    pendingOrders: pendingOrdersRes.count || 0,
    unpaidOrders: unpaidOrdersRes.count || 0,
    brokenLinks: brokenLinksRes.count || 0,
  };
}
