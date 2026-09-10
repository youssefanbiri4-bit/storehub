import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Warehouse, AlertTriangle, PackageX, Package } from "lucide-react";
import { getInventoryOverview } from "@/services/admin/inventory";
import { EmptyState } from "@/components/admin/empty-state";
import { KpiCard } from "@/components/admin/kpi-card";
import { StatusBadge } from "@/components/admin/status-badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filter = typeof params.filter === "string" ? params.filter : "all";

  const { items, stats, error } = await getInventoryOverview();

  const filteredItems = filter === "all"
    ? items
    : filter === "low"
    ? items.filter((i) => i.stock_quantity > 0 && i.stock_quantity <= 5)
    : filter === "out"
    ? items.filter((i) => i.stock_quantity <= 0)
    : items;

  const formatStockStatus = (qty: number, reserved: number) => {
    const available = qty - reserved;
    if (qty <= 0) return { label: "Out of Stock", status: "danger" as const };
    if (available <= 5) return { label: "Low Stock", status: "warning" as const };
    return { label: "In Stock", status: "success" as const };
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Badge variant="outline" className="mb-2 text-xs">Operations</Badge>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Inventory</h1>
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
          <p className="text-sm text-danger">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-xs">Operations</Badge>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">Track stock levels across all products</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Products" value={stats.totalProducts} icon={Package} />
        <KpiCard
          title="Stock Value"
          value={`MAD ${(stats.totalStockValue / 100).toLocaleString()}`}
          icon={Warehouse}
        />
        <KpiCard title="Low Stock" value={stats.lowStockCount} icon={AlertTriangle} href="/admin/inventory?filter=low" />
        <KpiCard title="Out of Stock" value={stats.outOfStockCount} icon={PackageX} href="/admin/inventory?filter=out" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All", count: stats.totalProducts },
          { key: "low", label: "Low Stock", count: stats.lowStockCount },
          { key: "out", label: "Out of Stock", count: stats.outOfStockCount },
        ].map((f) => (
          <Link key={f.key} href={`/admin/inventory?filter=${f.key}`}>
            <Button
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
            >
              {f.label}
              <Badge variant="secondary" className="ml-1 text-[10px]">{f.count}</Badge>
            </Button>
          </Link>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="No inventory items"
          description="Inventory data will appear here for products with stock tracking."
          action={{ label: "View Products", href: "/admin/products" }}
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="hidden lg:grid lg:grid-cols-[1fr_100px_80px_80px_80px_100px] gap-4 items-center px-4 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">Product</span>
            <span className="text-xs font-medium text-muted-foreground">SKU</span>
            <span className="text-xs font-medium text-muted-foreground">Stock</span>
            <span className="text-xs font-medium text-muted-foreground">Reserved</span>
            <span className="text-xs font-medium text-muted-foreground">Available</span>
            <span className="text-xs font-medium text-muted-foreground">Status</span>
          </div>

          {filteredItems.map((item) => {
            const stockStatus = formatStockStatus(item.stock_quantity, item.reserved_quantity);
            return (
              <div
                key={item.id}
                className="grid grid-cols-1 lg:grid-cols-[1fr_100px_80px_80px_80px_100px] gap-4 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.cover_image ? (
                    <img src={item.cover_image} alt={item.name} className="h-8 w-8 rounded-lg object-cover border border-border shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-muted-foreground">{item.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground lg:hidden">{item.sku || "No SKU"}</p>
                  </div>
                </div>
                <div className="hidden lg:block text-sm text-muted-foreground">
                  {item.sku || "—"}
                </div>
                <div className="text-sm font-medium">{item.stock_quantity}</div>
                <div className="text-sm text-muted-foreground">{item.reserved_quantity}</div>
                <div className="text-sm font-medium">{item.available_quantity}</div>
                <div>
                  <StatusBadge label={stockStatus.label} status={stockStatus.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
