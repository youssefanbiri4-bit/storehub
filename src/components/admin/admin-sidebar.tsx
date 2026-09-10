"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  Warehouse,
  Truck,
  Ticket,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "SALES",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    ],
  },
  {
    label: "CATALOG",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
      { href: "/admin/shipping", label: "Shipping", icon: Truck },
    ],
  },
  {
    label: "GROWTH",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function SidebarNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
        isActive
          ? "bg-foreground/8 text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-danger text-white text-xs font-semibold">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

export function AdminSidebar({ notificationCount = 0 }: { notificationCount?: number }) {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (label: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex w-60 lg:w-64 flex-col border-r border-border bg-surface h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2.5 font-bold text-lg text-foreground font-heading">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-foreground text-background text-sm font-bold">
            D
          </span>
          <span>Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Admin navigation">
        {navigation.map((section) => {
          const isCollapsed = collapsedSections.has(section.label);
          const hasActiveChild = section.items.some((item) => isActive(item.href));

          return (
            <div key={section.label} className="mb-2">
              <button
                onClick={() => toggleSection(section.label)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase select-none"
                aria-expanded={!isCollapsed}
              >
                {section.label}
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-150 ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5 mt-0.5">
                  {section.items.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      item={item}
                      isActive={isActive(item.href)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
          target="_blank"
        >
          <span className="h-4 w-4 shrink-0" />
          View Store
        </Link>
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  const mobileLinks = [
    { href: "/admin", label: "Home", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/settings", label: "More", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border">
      <nav className="flex justify-around py-2" aria-label="Admin navigation">
        {mobileLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors duration-150 ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
