"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  Heart,
  Search,
  ArrowRight,
  ShoppingCart,
  User,
  ChevronDown,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useFavorites } from "@/hooks/use-favorites";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Category } from "@/types";

export function Header({ categories }: { categories?: Category[] }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { favorites, loaded } = useFavorites();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const activeCategories = (categories || []).filter(
    (c) => c.status === "active" || c.status === undefined || !c.status
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#3B472C]/20" style={{ background: 'rgba(59, 71, 44, 0.96)', backdropFilter: 'blur(8px)' }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight font-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3B472C] rounded-md"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#E7F5DC] text-[#3B472C] text-sm font-bold">
            S
          </span>
          <span className="hidden sm:inline text-white">
            {siteConfig.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-0.5"
          aria-label="Main navigation"
        >
          {siteConfig.navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="px-3 py-1.5 text-sm font-medium text-white/72 hover:text-white transition-colors rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              {link.label}
            </Link>
          ))}

          {/* Premium Categories dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Product categories"
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white/72 hover:text-white transition-all rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              Categories
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Invisible hover bridge */}
            <div
              className="absolute top-full left-0 right-0 h-2 -translate-y-0.5 pointer-events-none"
              aria-hidden="true"
            />

            {/* Mega menu */}
            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[680px] max-w-[90vw] rounded-2xl border border-[#3B472C]/30 bg-[#3B472C]/95 backdrop-blur-2xl shadow-2xl shadow-black/30 transition-all duration-200 ease-out overflow-hidden ${
                menuOpen
                  ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                  : "opacity-0 -translate-y-1.5 scale-[0.98] pointer-events-none"
              }`}
              role="menu"
              aria-orientation="vertical"
            >
              <div className="p-6">
                {activeCategories.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                      {activeCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products?category=${cat.slug || cat.id}`}
                          className="block px-3 py-2.5 rounded-xl text-sm font-medium text-white/72 hover:text-white hover:bg-white/10 hover:translate-x-0.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="block truncate">{cat.name}</span>
                          <span className="block text-[10px] text-white/50 mt-0.5 truncate">
                            {cat.description || "Browse products"}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <Link
                        href="/products"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#E7F5DC] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 rounded-md px-2 py-1 -ml-2"
                        onClick={() => setMenuOpen(false)}
                      >
                        View All Products
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-white/50 px-3 py-4">
                      No categories available yet.
                    </p>
                    <div className="mt-2 pt-4 border-t border-white/10">
                      <Link
                        href="/products"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#E7F5DC] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 rounded-md px-2 py-1 -ml-2"
                        onClick={() => setMenuOpen(false)}
                      >
                        View All Products
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden md:inline-flex text-white/82 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
            render={<Link href="/products" aria-label="Search products" />}
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="relative text-white/82 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
            render={<Link href="/favorites" aria-label="Open wishlist" />}
          >
            <Heart className="h-4 w-4" />
            {loaded && favorites.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-[#E7F5DC] text-[#3B472C] text-[10px] font-bold flex items-center justify-center px-1">
                {favorites.length}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="relative text-white/82 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
            render={<Link href="/cart" aria-label="Open cart" />}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>

          {user ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white/82 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
              render={<Link href="/account" aria-label="My account" />}
            >
              <User className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="accent"
              size="sm"
              className="hidden md:inline-flex gap-1.5 bg-[#E7F5DC] text-[#273020] hover:bg-[#CFE1B9]"
              render={<Link href="/login" />}
            >
              Sign In
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden text-white/82 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 border-[#3B472C]/30" style={{ background: 'rgba(59, 71, 44, 0.96)' }}>
              <div className="flex flex-col h-full">
                <div className="p-5 border-b border-white/10">
                  <Link
                    href="/"
                    className="flex items-center gap-2.5 font-bold text-lg font-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded-md"
                    onClick={() => setOpen(false)}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#E7F5DC] text-[#3B472C] text-sm font-bold">
                      S
                    </span>
                    <span className="text-white">{siteConfig.name}</span>
                  </Link>
                </div>
                <nav
                  className="flex-1 p-4 space-y-0.5"
                  aria-label="Main navigation"
                >
                  {siteConfig.navLinks.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/72 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* Mobile Categories Accordion */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/72 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                      aria-expanded={mobileCategoriesOpen}
                      aria-label="Toggle categories"
                    >
                      <span>Categories</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          mobileCategoriesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ease-out ${
                        mobileCategoriesOpen
                          ? "max-h-[400px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="pl-4 mt-1 space-y-0.5">
                        {activeCategories.length > 0 ? (
                          activeCategories.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/products?category=${cat.slug || cat.id}`}
                              onClick={() => {
                                setOpen(false);
                                setMobileCategoriesOpen(false);
                              }}
                              className="block px-3 py-2 rounded-md text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                            >
                              {cat.name}
                            </Link>
                          ))
                        ) : (
                          <span className="block px-3 py-2 text-sm text-white/50">
                            No categories available yet.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/favorites"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/72 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  >
                    <Heart className="h-4 w-4" />
                    Wishlist
                    {loaded && favorites.length > 0 && (
                      <span className="ml-auto h-5 min-w-5 rounded-full bg-[#E7F5DC] text-[#3B472C] text-[11px] font-bold flex items-center justify-center px-1.5">
                        {favorites.length}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/72 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Cart
                  </Link>
                </nav>
                <div className="p-4 border-t border-white/10 space-y-2">
                  {user ? (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/72 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                      <Button
                        variant="accent"
                        size="sm"
                        className="w-full gap-1.5 bg-[#E7F5DC] text-[#273020] hover:bg-[#CFE1B9]"
                        render={
                          <Link
                            href="/products"
                            onClick={() => setOpen(false)}
                          />
                        }
                      >
                        Browse Products
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="accent"
                        size="sm"
                        className="w-full bg-[#E7F5DC] text-[#273020] hover:bg-[#CFE1B9]"
                        render={
                          <Link
                            href="/login"
                            onClick={() => setOpen(false)}
                          />
                        }
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-white/10 text-white hover:bg-white/10"
                        render={
                          <Link
                            href="/register"
                            onClick={() => setOpen(false)}
                          />
                        }
                      >
                        Create Account
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
