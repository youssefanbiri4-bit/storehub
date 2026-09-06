import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight } from "lucide-react";

export const metadata = { title: "Orders" };

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatMoney(minor: number, currency: string) {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account/orders");

  const { data: orders, error } = await supabase
    .from("customer_orders")
    .select("id, order_number, status, payment_status, total_minor, currency, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="max-w-3xl">
        <Badge variant="outline" className="mb-3 text-xs">Orders</Badge>
        <h1 className="text-2xl font-bold font-heading mb-2">My Orders</h1>
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          Could not load your orders. Please try again later.
        </div>
      </div>
    );
  }

  // Fetch item counts for each order
  const counts = new Map<string, number>();
  if (orders && orders.length > 0) {
    const ids = orders.map((o) => o.id);
    const { data: items } = await supabase.from("order_items").select("order_id").in("order_id", ids);
    for (const it of items || []) {
      counts.set(it.order_id, (counts.get(it.order_id) || 0) + 1);
    }
  }

  return (
    <div className="max-w-3xl">
      <Badge variant="outline" className="mb-3 text-xs">Orders</Badge>
      <h1 className="text-2xl font-bold font-heading mb-2">My Orders</h1>
      <p className="text-sm text-muted-foreground mb-6">View and track your orders.</p>

      {!orders || orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="font-semibold mb-1">No orders yet</h2>
          <p className="text-sm text-muted-foreground mb-4">You haven&apos;t placed any orders yet.</p>
          <Button variant="outline" size="sm" render={<Link href="/products" />}>Start Shopping</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border bg-surface p-4 hover:bg-muted transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{order.order_number}</span>
                  <Badge variant="secondary" className="text-[11px] capitalize">{order.status.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline" className="text-[11px] capitalize">{order.payment_status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span>{formatDate(order.created_at)}</span>
                  <span>•</span>
                  <span>{formatMoney(order.total_minor, order.currency)}</span>
                  <span>•</span>
                  <span>{counts.get(order.id) || 0} {(counts.get(order.id) || 0) === 1 ? "item" : "items"}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
