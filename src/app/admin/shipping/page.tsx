import { Badge } from "@/components/ui/badge";
import { Truck, MapPin } from "lucide-react";
import { getShippingZones, getShippingMethods } from "@/services/admin/shipping";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const [zones, methods] = await Promise.all([getShippingZones(), getShippingMethods()]);

  const formatRate = (minor: number) => {
    return minor === 0 ? "Free" : `MAD ${(minor / 100).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-xs">Operations</Badge>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Shipping</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage shipping zones and delivery methods</p>
      </div>

      {/* Shipping Zones */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Shipping Zones</h2>
        </div>
        {zones.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No shipping zones configured</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {zones.map((zone) => (
              <div key={zone.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{zone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {zone.type === "domestic" ? "Domestic" : "International"} · {zone.countries?.length || 0} countries
                    </p>
                  </div>
                  <StatusBadge
                    label={zone.is_active ? "Active" : "Inactive"}
                    status={zone.is_active ? "success" : "neutral"}
                  />
                </div>
                {zone.methods && zone.methods.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {zone.methods.map((method) => (
                      <div key={method.id} className="flex items-center gap-4 text-xs text-muted-foreground pl-4 py-1">
                        <span>{method.name}</span>
                        <span>Base: {formatRate(method.base_rate_minor)}</span>
                        <span>Per kg: {formatRate(method.per_kg_rate_minor)}</span>
                        {method.estimated_days_min && method.estimated_days_max && (
                          <span>{method.estimated_days_min}-{method.estimated_days_max} days</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shipping Methods */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">All Shipping Methods</h2>
        </div>
        {methods.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No shipping methods"
            description="Configure shipping methods within your shipping zones."
            action={{ label: "View Products", href: "/admin/products" }}
          />
        ) : (
          <div className="divide-y divide-border">
            {methods.map((method) => (
              <div key={method.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{method.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Zone: {method.zone?.name || "Unknown"} · {method.free_shipping_threshold_minor ? `Free over MAD ${(method.free_shipping_threshold_minor / 100).toLocaleString()}` : "No free threshold"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatRate(method.base_rate_minor)}</span>
                  <StatusBadge
                    label={method.is_active ? "Active" : "Inactive"}
                    status={method.is_active ? "success" : "neutral"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
