"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useFavorites } from "@/hooks/use-favorites";
import { ProductCard } from "@/components/shared/product-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import type { Product } from "@/types";

export function WishlistClient() {
  const { favorites, removeFavorite, loaded } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load favorites from localStorage (existing system)
  useEffect(() => {
    if (!loaded) return;
    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(*)")
        .in("id", favorites)
        .eq("status", "published");
      setProducts((data || []) as Product[]);
      setLoading(false);
    };
    fetchFavorites();
  }, [favorites, loaded]);

  // Also attempt to load DB wishlist_items for authenticated users
  useEffect(() => {
    const loadDbWishlist = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setDbLoaded(true);
        return;
      }
      // Fetch wishlist via user_id join
      const { data: wishlist } = await supabase.from("wishlists").select("id").eq("user_id", user.id).single();
      if (!wishlist) {
        setDbLoaded(true);
        return;
      }
      const { data: items } = await supabase.from("wishlist_items").select("product_id").eq("wishlist_id", wishlist.id);
      const ids = (items || []).map((i) => i.product_id);
      if (ids.length === 0) {
        setDbLoaded(true);
        return;
      }
      const { data: prods } = await supabase
        .from("products")
        .select("*, category:categories(*)")
        .in("id", ids)
        .eq("status", "published");
      setDbProducts((prods || []) as Product[]);
      setDbLoaded(true);
    };
    loadDbWishlist();
  }, []);

  // Merge: prefer union of both, dedupe
  const merged = (() => {
    const map = new Map<string, Product>();
    for (const p of dbProducts) map.set(p.id, p);
    for (const p of products) map.set(p.id, p);
    return Array.from(map.values());
  })();

  const isLoading = !loaded || loading || !dbLoaded;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  if (merged.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-surface">
        <div className="rounded-2xl bg-muted p-6 mb-6">
          <Heart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2 font-heading">Your wishlist is empty</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">Save products you love and they will appear here.</p>
        <Button render={<Link href="/products" />}>Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{merged.length} {merged.length === 1 ? "product" : "products"} saved</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {merged.map((product) => (
          <div key={product.id} className="relative group">
            <ProductCard product={product} />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 h-7 text-xs bg-surface/90 backdrop-blur"
              onClick={() => {
                // Remove from both storages - use explicit remove to avoid re-adding DB-only items to localStorage
                removeFavorite(product.id);
                setProducts((prev) => prev.filter((p) => p.id !== product.id));
                // Also try DB delete
                (async () => {
                  const supabase = createClient();
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) return;
                  const { data: wl } = await supabase.from("wishlists").select("id").eq("user_id", user.id).single();
                  if (!wl) return;
                  await supabase.from("wishlist_items").delete().eq("wishlist_id", wl.id).eq("product_id", product.id);
                  setDbProducts((prev) => prev.filter((p) => p.id !== product.id));
                })();
              }}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
