"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/product-card";
import { useFavorites } from "@/hooks/use-favorites";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";

export default function FavoritesPage() {
  const { favorites, loaded } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loaded) return;

    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(*)")
        .in("id", favorites)
        .eq("is_published", true);
      setProducts((data || []) as Product[]);
      setLoading(false);
    };

    fetchFavorites();
  }, [favorites, loaded]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-heading mb-3">
            Your saved collection
          </h1>
          <p className="text-muted-foreground text-lg">
            {favorites.length === 0
              ? "You have no saved products yet."
              : `${favorites.length} ${favorites.length === 1 ? "product" : "products"} saved.`}
          </p>
        </div>

        {!loaded || loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface h-80 animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-2xl bg-surface p-6 mb-6 border border-border">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-3 font-heading">
              Your saved collection is empty.
            </h2>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              Save products you want to revisit and they will appear here.
            </p>
            <Button size="lg" className="gap-2" render={<Link href="/products" />}>
              Explore Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
