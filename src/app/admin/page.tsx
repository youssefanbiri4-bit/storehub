import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  AlertTriangle,
  Plus,
  Eye,
  MousePointerClick,
  Download,
  Tags,
  Search,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import { TopProducts } from "@/components/admin/dashboard/top-products";
import { NeedsAttention } from "@/components/admin/dashboard/needs-attention";
import { getDashboardData } from "@/services/admin/dashboard";
import {
  getMostViewedCategories,
  getPopularSearches,
  getNoResultSearches,
  getFunnelData,
} from "@/services/analytics";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [dashboard, viewedCategories, popularSearches, noResultSearches, funnel] =
    await Promise.all([
      getDashboardData(),
      getMostViewedCategories(5),
      getPopularSearches(5),
      getNoResultSearches(5),
      getFunnelData(),
    ]);

  const { kpis, revenueChart, recentOrders, topProducts, lowStockProducts, pendingOrders, unpaidOrders, brokenLinks } = dashboard;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="outline" className="mb-2 text-xs">Dashboard</Badge>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Last 30 days overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/new">
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue"
          value={`MAD ${kpis.totalRevenue.toLocaleString()}`}
          change={kpis.totalRevenueChange}
          changeLabel="vs prev 30d"
          icon={DollarSign}
          href="/admin/orders"
        />
        <KpiCard
          title="Orders"
          value={kpis.totalOrders}
          change={kpis.totalOrdersChange}
          changeLabel="vs prev 30d"
          icon={ShoppingCart}
          href="/admin/orders"
        />
        <KpiCard
          title="Customers"
          value={kpis.totalCustomers}
          change={kpis.totalCustomersChange}
          changeLabel="total"
          icon={Users}
          href="/admin/customers"
        />
        <KpiCard
          title="Conversion"
          value={`${kpis.conversionRate}%`}
          icon={TrendingUp}
          href="/admin/products"
        />
      </div>

      {/* Revenue Chart + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm mb-4">Revenue Over Time</h3>
          <RevenueChart data={revenueChart} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm mb-4">Needs Attention</h3>
          <NeedsAttention
            pendingOrders={pendingOrders}
            unpaidOrders={unpaidOrders}
            lowStockProducts={lowStockProducts}
            brokenLinks={brokenLinks}
          />
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          <RecentOrders orders={recentOrders} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Top Products by Revenue</h3>
            <Link href="/admin/products" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          <TopProducts products={topProducts} />
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-foreground" />
            Conversion Funnel
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Views</span>
              </div>
              <span className="font-semibold text-sm">{funnel.total_views.toLocaleString()}</span>
            </div>
            <div className="flex justify-center"><ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /></div>
            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">CTA Clicks</span>
              </div>
              <span className="font-semibold text-sm">{funnel.total_clicks.toLocaleString()}</span>
            </div>
            <div className="rounded-lg bg-success/5 border border-success/20 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Click Rate</p>
              <p className="text-xl font-bold text-success">{funnel.cta_click_rate}%</p>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Tags className="h-4 w-4 text-foreground" />
            Top Categories
          </h3>
          {viewedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
          ) : (
            <div className="space-y-2">
              {viewedCategories.map((cat, i) => (
                <div key={cat.id} className="flex items-center justify-between text-sm py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-5">{i + 1}.</span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{cat.view_count}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Intelligence */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-foreground" />
            Search Insights
          </h3>
          {popularSearches.length === 0 && noResultSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No search data</p>
          ) : (
            <div className="space-y-4">
              {popularSearches.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Popular Searches</p>
                  {popularSearches.slice(0, 3).map((s) => (
                    <div key={s.query} className="flex items-center justify-between text-sm py-1">
                      <span className="truncate">&ldquo;{s.query}&rdquo;</span>
                      <Badge variant="secondary" className="shrink-0">{s.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {noResultSearches.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">No-Result Searches</p>
                  {noResultSearches.slice(0, 3).map((s) => (
                    <div key={s.query} className="flex items-center justify-between text-sm py-1">
                      <span className="truncate">&ldquo;{s.query}&rdquo;</span>
                      <Badge variant="outline" className="text-warning shrink-0">{s.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
