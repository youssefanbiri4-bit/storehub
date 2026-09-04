import { Eye, MousePointerClick, Tags, TrendingUp, AlertTriangle, Globe, FileEdit, CalendarClock, Plus, Download, ShoppingCart, DollarSign, Package, PackageX, Search, BarChart3, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminStats } from "@/services/products";
import { getMostViewedCategories, getPopularSearches, getNoResultSearches, getFunnelData } from "@/services/analytics";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [stats, viewedCategories, popularSearches, noResultSearches, funnel] =
    await Promise.all([
      getAdminStats(),
      getMostViewedCategories(10),
      getPopularSearches(10),
      getNoResultSearches(10),
      getFunnelData(),
    ]);

  const statCards = [
    { title: "Total Products", value: stats.total_products, icon: Package, color: "text-foreground", href: "/admin/products" },
    { title: "Published", value: stats.published_count, icon: Globe, color: "text-success", href: "/admin/products?status=published" },
    { title: "Drafts", value: stats.draft_count, icon: FileEdit, color: "text-muted-foreground", href: "/admin/products?status=draft" },
    { title: "Scheduled", value: stats.scheduled_count, icon: CalendarClock, color: "text-info", href: "/admin/products?status=scheduled" },
    { title: "Out of Stock", value: stats.out_of_stock_count, icon: PackageX, color: "text-danger", href: "/admin/products?status=published" },
    { title: "Broken Links", value: stats.broken_links_count, icon: AlertTriangle, color: "text-danger", href: "/admin/products?link=broken" },
    { title: "Total Views", value: stats.total_views.toLocaleString(), icon: Eye, color: "text-foreground", href: null },
    { title: "Total Clicks", value: stats.total_clicks.toLocaleString(), icon: MousePointerClick, color: "text-foreground", href: null },
    { title: "Total Downloads", value: stats.total_downloads.toLocaleString(), icon: Download, color: "text-foreground", href: null },
    { title: "Orders", value: stats.total_orders.toLocaleString(), icon: ShoppingCart, color: "text-success", href: null },
    { title: "Revenue", value: `${stats.total_revenue.toLocaleString()}`, icon: DollarSign, color: "text-success", href: null },
    { title: "Avg. Conversion", value: `${stats.avg_conversion.toFixed(1)}%`, icon: TrendingUp, color: "text-success", href: null },
    { title: "Categories", value: stats.categories_count, icon: Tags, color: "text-warning", href: "/admin/categories" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="outline" className="mb-2 text-xs">Dashboard</Badge>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Overview</h1>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          const card = (
            <div
              key={stat.title}
              className={`rounded-2xl border border-border bg-surface p-5 card-lift admin-fade-in ${stat.href ? "cursor-pointer" : ""}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={stat.color}><Icon className="h-5 w-5" /></div>
              </div>
            </div>
          );

          return stat.href ? (
            <Link key={stat.title} href={stat.href} className="block">{card}</Link>
          ) : (
            <div key={stat.title}>{card}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Eye className="h-4 w-4 text-foreground" />
            Most Viewed
          </h3>
          {stats.top_viewed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.top_viewed.map((product, i) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-5">{i + 1}.</span>
                    <span className="line-clamp-1">{product.name}</span>
                  </div>
                  <Badge variant="secondary">{product.view_count} views</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <MousePointerClick className="h-4 w-4 text-foreground" />
            Most Clicked
          </h3>
          {stats.top_clicked.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.top_clicked.map((product, i) => {
                const conversion = product.view_count > 0
                  ? ((product.click_count / product.view_count) * 100).toFixed(1)
                  : "0";
                return (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground w-5">{i + 1}.</span>
                      <span className="line-clamp-1">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{product.click_count} clicks</Badge>
                      <Badge variant="outline" className="text-xs">{conversion}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Download className="h-4 w-4 text-foreground" />
            Most Downloaded
          </h3>
          {stats.top_downloaded.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.top_downloaded.map((product, i) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-5">{i + 1}.</span>
                    <span className="line-clamp-1">{product.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {product.delivery_method === "hosted_file" ? "hosted" : "external"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Catalog Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-foreground" />
            Conversion Funnel
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Product Views</span>
              </div>
              <span className="font-semibold text-sm">{funnel.total_views.toLocaleString()}</span>
            </div>
            <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Product Details</span>
              </div>
              <span className="text-sm text-muted-foreground">(same as views)</span>
            </div>
            <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-3">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">CTA Clicks</span>
              </div>
              <span className="font-semibold text-sm">{funnel.total_clicks.toLocaleString()}</span>
            </div>
            <div className="rounded-xl bg-success/5 border border-success/20 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">CTA Click Rate</p>
              <p className="text-2xl font-bold text-success">{funnel.cta_click_rate}%</p>
            </div>
            {funnel.total_views === 0 && (
              <p className="text-xs text-muted-foreground text-center">No data available yet</p>
            )}
          </div>
        </div>

        {/* Most Viewed Categories */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Tags className="h-4 w-4 text-foreground" />
            Most Viewed Categories
          </h3>
          {viewedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
          ) : (
            <div className="space-y-3">
              {viewedCategories.map((cat, i) => (
                <div key={cat.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-5">{i + 1}.</span>
                    <span className="line-clamp-1">{cat.name}</span>
                  </div>
                  <Badge variant="secondary">{cat.view_count} views</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-foreground" />
            Popular Searches
          </h3>
          {popularSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
          ) : (
            <div className="space-y-3">
              {popularSearches.map((s, i) => (
                <div key={s.query} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-5">{i + 1}.</span>
                    <span className="font-medium line-clamp-1">&ldquo;{s.query}&rdquo;</span>
                  </div>
                  <Badge variant="secondary">{s.count} searches</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            No-Result Searches
          </h3>
          {noResultSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
          ) : (
            <div className="space-y-3">
              {noResultSearches.map((s, i) => (
                <div key={s.query} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-5">{i + 1}.</span>
                    <span className="font-medium line-clamp-1">&ldquo;{s.query}&rdquo;</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">{s.count} searches</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
