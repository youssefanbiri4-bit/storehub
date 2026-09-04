"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

export function RecentlyViewed() {
  const { recent, clearRecent, loaded } = useRecentlyViewed();

  if (!loaded || recent.length === 0) return null;

  return (
    <section className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold font-heading">Recently Viewed</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={clearRecent}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear History
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recent.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-square bg-muted">
                  {product.cover_image ? (
                    <Image
                      src={product.cover_image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {product.is_free ? "Free" : `${product.price} ${product.currency}`}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
