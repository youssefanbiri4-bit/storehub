import { InsightCard } from "@/components/admin/insight-card";
import { AlertTriangle, ShoppingCart, DollarSign, LinkIcon } from "lucide-react";

interface NeedsAttentionProps {
  pendingOrders: number;
  unpaidOrders: number;
  lowStockProducts: Array<{ id: string; name: string; stock_quantity: number }>;
  brokenLinks: number;
}

export function NeedsAttention({ pendingOrders, unpaidOrders, lowStockProducts, brokenLinks }: NeedsAttentionProps) {
  const hasAnyAlerts = pendingOrders > 0 || unpaidOrders > 0 || lowStockProducts.length > 0 || brokenLinks > 0;

  if (!hasAnyAlerts) {
    return (
      <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
        <p className="text-sm text-success font-medium">All clear! No issues requiring attention.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pendingOrders > 0 && (
        <InsightCard
          icon={ShoppingCart}
          iconColor="bg-warning/10 text-warning"
          title={`${pendingOrders} pending order${pendingOrders > 1 ? "s" : ""}`}
          description="Orders waiting for confirmation or payment"
          href="/admin/orders"
        />
      )}
      {unpaidOrders > 0 && (
        <InsightCard
          icon={DollarSign}
          iconColor="bg-danger/10 text-danger"
          title={`${unpaidOrders} unpaid order${unpaidOrders > 1 ? "s" : ""}`}
          description="Orders with outstanding payment"
          href="/admin/orders"
        />
      )}
      {lowStockProducts.length > 0 && (
        <InsightCard
          icon={AlertTriangle}
          iconColor="bg-warning/10 text-warning"
          title={`${lowStockProducts.length} product${lowStockProducts.length > 1 ? "s" : ""} running low on stock`}
          description={lowStockProducts.map((p) => p.name).join(", ")}
          href="/admin/inventory"
        />
      )}
      {brokenLinks > 0 && (
        <InsightCard
          icon={LinkIcon}
          iconColor="bg-danger/10 text-danger"
          title={`${brokenLinks} broken link${brokenLinks > 1 ? "s" : ""}`}
          description="Products with broken external links"
          href="/admin/products?link=broken"
        />
      )}
    </div>
  );
}
