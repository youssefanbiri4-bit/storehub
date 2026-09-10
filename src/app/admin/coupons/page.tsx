import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Ticket } from "lucide-react";
import { getCoupons } from "@/services/admin/coupons";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";

export const dynamic = "force-dynamic";

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) || 1 : 1;
  const search = typeof params.search === "string" ? params.search : "";

  const { coupons, total, totalPages, error } = await getCoupons({
    search: search || undefined,
    page,
    limit: 20,
  });

  const formatDiscount = (type: string, value: number) => {
    return type === "percentage" ? `${value}%` : `MAD ${(value / 100).toLocaleString()}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Badge variant="outline" className="mb-2 text-xs">Growth</Badge>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Coupons</h1>
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
          <p className="text-sm text-danger">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="outline" className="mb-2 text-xs">Growth</Badge>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} coupon{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <form className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="search" placeholder="Search by code..." defaultValue={search} className="pl-10" />
        </div>
        <Button type="submit" size="sm">Search</Button>
      </form>

      {coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No coupons yet"
          description="Create discount codes to attract customers and boost sales."
          action={{ label: "View Products", href: "/admin/products" }}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="hidden lg:grid lg:grid-cols-[1fr_100px_100px_100px_100px_120px] gap-4 items-center px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">Code</span>
              <span className="text-xs font-medium text-muted-foreground">Discount</span>
              <span className="text-xs font-medium text-muted-foreground">Usage</span>
              <span className="text-xs font-medium text-muted-foreground">Limit</span>
              <span className="text-xs font-medium text-muted-foreground">Expires</span>
              <span className="text-xs font-medium text-muted-foreground">Status</span>
            </div>

            {coupons.map((coupon) => {
              const expired = isExpired(coupon.expires_at);
              return (
                <div
                  key={coupon.id}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_100px_100px_100px_100px_120px] gap-4 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-mono font-medium">{coupon.code}</p>
                    {coupon.description && (
                      <p className="text-xs text-muted-foreground truncate">{coupon.description}</p>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {formatDiscount(coupon.discount_type, coupon.discount_value_minor)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {coupon.usage_count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {coupon.usage_limit ?? "∞"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(coupon.expires_at)}
                  </div>
                  <div>
                    {expired ? (
                      <StatusBadge label="Expired" status="neutral" />
                    ) : coupon.is_active ? (
                      <StatusBadge label="Active" status="success" />
                    ) : (
                      <StatusBadge label="Inactive" status="neutral" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a href={`?page=${page - 1}&search=${encodeURIComponent(search)}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </a>
                )}
                {page < totalPages && (
                  <a href={`?page=${page + 1}&search=${encodeURIComponent(search)}`}>
                    <Button variant="outline" size="sm">Next</Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
