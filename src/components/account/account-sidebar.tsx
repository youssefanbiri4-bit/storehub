"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, MapPin, Heart, User, Shield, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const links: Array<{ href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/security", label: "Security", icon: Shield },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav aria-label="Account navigation" className="w-full">
      {/* Desktop sidebar — white surface, subtle border, premium vertical rows */}
      <div className="hidden lg:block rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#D7E1CC" }}>
        <div className="px-4 pt-5 pb-4">
          <h2 className="font-heading font-bold text-[14px] tracking-tight" style={{ color: "#1F241B" }}>
            My Account
          </h2>
          <p className="text-xs mt-1 leading-snug" style={{ color: "#66705B" }}>
            Manage your orders and settings
          </p>
        </div>

        <div className="px-2 pb-2 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className="flex items-center gap-3 rounded-lg px-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#88976C] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                style={{
                  height: "44px",
                  backgroundColor: isActive ? "#3B472C" : "transparent",
                  color: isActive ? "#FFFFFF" : "#4F5B47",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#F3F7EF";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                }}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: isActive ? "#E7F5DC" : "#728156" }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="border-t mt-2 p-2" style={{ borderColor: "rgba(215,225,204,0.6)" }}>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#88976C] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            style={{ height: "44px", color: "#66705B" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3F7EF";
              (e.currentTarget as HTMLButtonElement).style.color = "#1F241B";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#66705B";
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile / Tablet — horizontal scrollable tabs */}
      <div className="lg:hidden -mx-4 px-4">
        <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className="inline-flex items-center gap-2 shrink-0 snap-start rounded-lg border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#88976C]"
                style={{
                  height: "36px",
                  backgroundColor: isActive ? "#3B472C" : "#FFFFFF",
                  color: isActive ? "#FFFFFF" : "#4F5B47",
                  borderColor: isActive ? "#3B472C" : "#D7E1CC",
                }}
              >
                <Icon
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: isActive ? "#E7F5DC" : "#728156" }}
                  aria-hidden="true"
                />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
