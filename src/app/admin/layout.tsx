"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar";
import { SearchCommand } from "@/components/admin/search-command";
import { NotificationBell } from "@/components/admin/notification-bell";

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; href?: string }> = [];

  if (segments[0] === "admin") {
    crumbs.push({ label: "Admin", href: "/admin" });
  }

  const segmentLabels: Record<string, string> = {
    products: "Products",
    categories: "Categories",
    orders: "Orders",
    customers: "Customers",
    inventory: "Inventory",
    shipping: "Shipping",
    coupons: "Coupons",
    settings: "Settings",
    notifications: "Notifications",
    new: "New",
    edit: "Edit",
  };

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const label = segmentLabels[segment] || (segment.length > 8 ? segment.slice(0, 8) + "..." : segment);
    const isLast = i === segments.length - 1;
    const href = isLast ? undefined : `/admin/${segments.slice(1, i + 1).join("/")}`;
    crumbs.push({ label, href });
  }

  return crumbs;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <div className="min-h-screen flex">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-background focus:border">
        Skip to content
      </a>

      <AdminSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 lg:px-6 border-b border-border bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-muted-foreground">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <SearchCommand />
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hidden sm:inline-flex"
              onClick={() => window.open("/", "_blank")}
              title="View Store"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-danger hover:text-danger"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="flex-1 p-4 lg:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <AdminMobileNav />
    </div>
  );
}
