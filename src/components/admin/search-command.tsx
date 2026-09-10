"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "product" | "order" | "customer" | "coupon";
  href: string;
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const termEscaped = term.replace(/[%",()]/g, " ").replace(/\s+/g, " ").trim();

    try {
      const [productsRes, ordersRes, customersRes, couponsRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, slug")
          .or(`name.ilike.%${termEscaped}%,slug.ilike.%${termEscaped}%`)
          .limit(3),
        supabase
          .from("customer_orders")
          .select("id, order_number, customer_email")
          .or(`order_number.ilike.%${termEscaped}%,customer_email.ilike.%${termEscaped}%`)
          .limit(3),
        supabase
          .from("profiles")
          .select("id, full_name")
          .or(`full_name.ilike.%${termEscaped}%`)
          .limit(3),
        supabase
          .from("coupons")
          .select("id, code, description")
          .or(`code.ilike.%${termEscaped}%,description.ilike.%${termEscaped}%`)
          .limit(3),
      ]);

      const searchResults: SearchResult[] = [];

      if (productsRes.data) {
        for (const p of productsRes.data) {
          searchResults.push({
            id: p.id,
            title: p.name,
            subtitle: "Product",
            type: "product",
            href: `/admin/products/${p.id}/edit`,
          });
        }
      }
      if (ordersRes.data) {
        for (const o of ordersRes.data) {
          searchResults.push({
            id: o.id,
            title: o.order_number,
            subtitle: o.customer_email,
            type: "order",
            href: `/admin/orders/${o.id}`,
          });
        }
      }
      if (customersRes.data) {
        for (const c of customersRes.data) {
          searchResults.push({
            id: c.id,
            title: c.full_name || "Unnamed",
            subtitle: "Customer",
            type: "customer",
            href: `/admin/customers`,
          });
        }
      }
      if (couponsRes.data) {
        for (const c of couponsRes.data) {
          searchResults.push({
            id: c.id,
            title: c.code,
            subtitle: c.description || "Coupon",
            type: "coupon",
            href: `/admin/coupons`,
          });
        }
      }

      setResults(searchResults);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const typeIcons = {
    product: Package,
    order: ShoppingCart,
    customer: Users,
    coupon: Ticket,
  };

  const typeLabels = {
    product: "Products",
    order: "Orders",
    customer: "Customers",
    coupon: "Coupons",
  };

  const grouped = results.reduce(
    (acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface text-sm text-muted-foreground hover:bg-muted transition-colors w-full max-w-xs"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-[15vh]">
          <div className="w-full max-w-lg mx-4">
            <Command
              className="rounded-xl border border-border bg-surface shadow-2xl overflow-hidden"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            >
              <div className="flex items-center gap-3 px-4 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search products, orders, customers, coupons..."
                  className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                {loading && (
                  <Command.Empty className="py-8 text-sm text-muted-foreground text-center">
                    Searching...
                  </Command.Empty>
                )}
                {!loading && query.length >= 2 && results.length === 0 && (
                  <Command.Empty className="py-8 text-sm text-muted-foreground text-center">
                    No results found for &ldquo;{query}&rdquo;
                  </Command.Empty>
                )}
                {Object.entries(grouped).map(([type, items]) => {
                  const Icon = typeIcons[type as keyof typeof typeIcons];
                  return (
                    <Command.Group
                      key={type}
                      heading={typeLabels[type as keyof typeof typeLabels]}
                      className="mb-2"
                    >
                      {items.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={`${item.title} ${item.subtitle}`}
                          onSelect={() => {
                            router.push(item.href);
                            setOpen(false);
                            setQuery("");
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
