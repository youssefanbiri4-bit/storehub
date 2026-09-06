import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Order Details" };

function formatMoney(minor: number, currency: string) {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/account/orders/${orderId}`);

  const { data: order, error } = await supabase
    .from("customer_orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    return notFound();
  }

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
  const { data: shipments } = await supabase.from("shipments").select("*").eq("order_id", order.id);
  const { data: payments } = await supabase.from("payments").select("*").eq("order_id", order.id);

  const addr = order.shipping_address_snapshot as Record<string, string | null> | null;

  return (
    <div className="max-w-3xl">
      <Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        ← Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <Badge variant="outline" className="mb-2 text-xs">Order {order.order_number}</Badge>
          <h1 className="text-2xl font-bold font-heading">Order Details</h1>
          <p className="text-sm text-muted-foreground mt-1">Placed on {formatDate(order.created_at)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="capitalize">{String(order.status).replace(/_/g, " ")}</Badge>
          <Badge variant="outline" className="capitalize">{String(order.payment_status)}</Badge>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-surface p-5 mb-6">
        <h2 className="font-semibold text-sm mb-3">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(order.subtotal_minor, order.currency)}</span></div>
          {order.discount_minor > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-green-600">-{formatMoney(order.discount_minor, order.currency)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatMoney(order.shipping_minor, order.currency)}</span></div>
          {order.tax_minor > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatMoney(order.tax_minor, order.currency)}</span></div>}
          <div className="flex justify-between font-semibold pt-2 border-t border-border"><span>Total</span><span>{formatMoney(order.total_minor, order.currency)}</span></div>
          <div className="flex justify-between text-xs text-muted-foreground pt-2"><span>Payment Method</span><span className="capitalize">{String(order.payment_method).replace(/_/g, " ")}</span></div>
          <div className="flex justify-between text-xs text-muted-foreground"><span>Currency</span><span>{order.currency}</span></div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border bg-surface p-5 mb-6">
        <h2 className="font-semibold text-sm mb-3">Items</h2>
        {!items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items found.</p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => {
              const r = it as Record<string, unknown>;
              return (
              <div key={String(r.id)} className="flex gap-3 rounded-lg border border-border p-3">
                {r.product_image ? <img src={String(r.product_image)} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" /> : <div className="h-14 w-14 rounded-lg bg-muted shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{String(r.product_name)}</p>
                  {r.variant_name ? <p className="text-xs text-muted-foreground">{String(r.variant_name)}</p> : null}
                  {r.sku ? <p className="text-xs text-muted-foreground">SKU: {String(r.sku)}</p> : null}
                  <p className="text-xs text-muted-foreground mt-1">Qty: {String(r.quantity)} • {formatMoney(Number(r.unit_price_minor), order.currency)} each</p>
                </div>
                <div className="text-sm font-semibold shrink-0">{formatMoney(Number(r.line_total_minor), order.currency)}</div>
              </div>
            );})}
          </div>
        )}
      </div>

      {/* Addresses */}
      {addr && (
        <div className="rounded-xl border border-border bg-surface p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3">Shipping Address</h2>
          <div className="text-sm leading-relaxed">
            <p className="font-medium">{addr.full_name}</p>
            <p>{addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ""}</p>
            <p>{addr.city}{addr.region ? `, ${addr.region}` : ""} {addr.postal_code || ""}</p>
            <p>{addr.country_code}</p>
            {addr.phone && <p className="text-muted-foreground mt-1">Phone: {addr.phone}</p>}
            {addr.delivery_notes && <p className="text-muted-foreground text-xs mt-1">Notes: {addr.delivery_notes}</p>}
          </div>
        </div>
      )}

      {/* Payments */}
      {payments && payments.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3">Payments</h2>
          <div className="space-y-2">
            {payments.map((p) => {
              const r = p as Record<string, unknown>;
              return (
              <div key={String(r.id)} className="flex justify-between text-sm">
                <span className="capitalize">{String(r.method).replace(/_/g, " ")} • <span className="text-muted-foreground">{String(r.status)}</span></span>
                <span>{formatMoney(Number(r.amount_minor), String(r.currency))}</span>
              </div>
            );})}
          </div>
        </div>
      )}

      {/* Shipments */}
      {shipments && shipments.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3">Shipments</h2>
          <div className="space-y-3">
            {shipments.map((s) => {
              const r = s as Record<string, unknown>;
              return (
              <div key={String(r.id)} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="capitalize font-medium">{String(r.status).replace(/_/g, " ")}</span>
                  {r.carrier ? <span className="text-muted-foreground text-xs">{String(r.carrier)}</span> : null}
                </div>
                {r.tracking_number ? <p className="text-xs mt-1">Tracking: {String(r.tracking_number)}</p> : null}
                {r.tracking_url ? <a href={String(r.tracking_url)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline break-all">Track package</a> : null}
                {r.shipped_at ? <p className="text-xs text-muted-foreground mt-1">Shipped: {formatDate(String(r.shipped_at))}</p> : null}
                {r.delivered_at ? <p className="text-xs text-muted-foreground">Delivered: {formatDate(String(r.delivered_at))}</p> : null}
              </div>
            );})}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" render={<Link href="/products" />}>Continue Shopping</Button>
        <Button variant="ghost" size="sm" render={<Link href="/account" />}>Back to Account</Button>
      </div>
    </div>
  );
}
