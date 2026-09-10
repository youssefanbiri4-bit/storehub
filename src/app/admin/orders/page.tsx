import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { getOrders } from "@/services/admin/orders";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/types";
import { EmptyState } from "@/components/admin/empty-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) || 1 : 1;
  const status = typeof params.status === "string" ? params.status : "all";
  const payment = typeof params.payment === "string" ? params.payment : "all";
  const search = typeof params.search === "string" ? params.search : "";

  const { orders, total, totalPages, error } = await getOrders({
    status: status !== "all" ? status : undefined,
    payment_status: payment !== "all" ? payment : undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const formatAmount = (minor: number, currency: string) => {
    return `${currency} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = (status: string): "success" | "warning" | "danger" | "info" | "neutral" => {
    const s = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES];
    if (!s) return "neutral";
    if (s.color.includes("green")) return "success";
    if (s.color.includes("yellow")) return "warning";
    if (s.color.includes("red")) return "danger";
    if (s.color.includes("blue") || s.color.includes("purple") || s.color.includes("indigo") || s.color.includes("cyan")) return "info";
    return "neutral";
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Badge variant="outline" className="mb-2 text-xs">Sales</Badge>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Orders</h1>
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
          <Badge variant="outline" className="mb-2 text-xs">Sales</Badge>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} order{total !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="search" placeholder="Search by order number or email..." defaultValue={search} className="pl-10" />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="h-9 px-3 rounded-lg border border-border bg-surface text-sm"
        >
          <option value="all">All Statuses</option>
          {Object.entries(ORDER_STATUSES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          name="payment"
          defaultValue={payment}
          className="h-9 px-3 rounded-lg border border-border bg-surface text-sm"
        >
          <option value="all">All Payment</option>
          {Object.entries(PAYMENT_STATUSES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <Button type="submit" size="sm">Filter</Button>
      </form>

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders found"
          description={search || status !== "all" || payment !== "all" ? "Try adjusting your filters." : "Orders will appear here once customers start purchasing."}
          action={{ label: "View Products", href: "/admin/products" }}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_140px_100px_120px_120px_140px] gap-4 items-center px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">Order</span>
              <span className="text-xs font-medium text-muted-foreground">Customer</span>
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <span className="text-xs font-medium text-muted-foreground">Payment</span>
              <span className="text-xs font-medium text-muted-foreground">Total</span>
              <span className="text-xs font-medium text-muted-foreground">Date</span>
            </div>

            {orders.map((order) => {
              const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
              const paymentInfo = PAYMENT_STATUSES[order.payment_status as keyof typeof PAYMENT_STATUSES];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const profileName = (order as any).profiles?.full_name as string | null;

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_140px_100px_120px_120px_140px] gap-4 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground lg:hidden">{order.customer_email}</p>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm truncate">{profileName || order.customer_email}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusInfo?.color || "bg-muted text-muted-foreground"}`}>
                      {statusInfo?.label || order.status}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${paymentInfo?.color || "bg-muted text-muted-foreground"}`}>
                      {paymentInfo?.label || order.payment_status}
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatAmount(order.total_minor, order.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`?page=${page - 1}&status=${status}&payment=${payment}&search=${encodeURIComponent(search)}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`?page=${page + 1}&status=${status}&payment=${payment}&search=${encodeURIComponent(search)}`}>
                    <Button variant="outline" size="sm">Next</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
