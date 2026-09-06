import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  MapPin,
  Heart,
  User,
  Shield,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "My Account",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account");

  // Parallelize independent queries
  const [profileRes, orderCountRes, wishlistRes, recentOrdersRes, defaultAddressRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("customer_orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("wishlists").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("customer_orders").select("id, order_number, status, total_minor, currency, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("addresses").select("city, country_code, address_line_1").eq("user_id", user.id).eq("is_default", true).maybeSingle(),
  ]);

  const profile = profileRes.data;
  const orderCount = orderCountRes.count;
  const recentOrders = recentOrdersRes.data;
  const defaultAddress = defaultAddressRes.data;

  // Wishlist count (depends on wishlist id, so separate)
  let wishlistCount = 0;
  if (wishlistRes.data) {
    const { count } = await supabase.from("wishlist_items").select("id", { count: "exact", head: true }).eq("wishlist_id", wishlistRes.data.id);
    wishlistCount = count || 0;
  }

  const quickLinks = [
    { href: "/account/orders", label: "Orders", icon: Package, count: orderCount || 0 },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/account/wishlist", label: "Wishlist", icon: Heart, count: wishlistCount || 0 },
    { href: "/account/profile", label: "Profile", icon: User },
    { href: "/account/security", label: "Security", icon: Shield },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 font-heading">
        Welcome back, {profile?.full_name || user.email?.split("@")[0]}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Quick Links
          </h2>
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{link.label}</span>
                  {link.count !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {link.count}
                    </Badge>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          {/* Default Address */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Default Address
            </h2>
            {defaultAddress ? (
              <p className="text-sm">
                {defaultAddress.address_line_1}, {defaultAddress.city},{" "}
                {defaultAddress.country_code}
              </p>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  No default address set
                </p>
                <Button variant="outline" size="sm" render={<Link href="/account/addresses" />}>
                  Add Address
                </Button>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Recent Orders
              </h2>
              <Link
                href="/account/orders"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-muted transition-colors text-sm"
                  >
                    <div>
                      <span className="font-medium">{order.order_number}</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(order.created_at).toLocaleDateString("en-US")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {(order.total_minor / 100).toFixed(2)} {order.currency}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
                <Button variant="outline" size="sm" className="mt-2" render={<Link href="/products" />}>
                  Start Shopping
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
