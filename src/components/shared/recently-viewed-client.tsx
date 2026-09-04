"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import type { Product } from "@/types";

interface RecentlyViewedClientProps {
  product: Product;
}

export function RecentlyViewedClient({ product }: RecentlyViewedClientProps) {
  const { addRecent } = useRecentlyViewed();
  const [showSticky, setShowSticky] = useState(false);
  const buyButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    addRecent({
      id: product.id,
      slug: product.slug,
      name: product.name,
      cover_image: product.cover_image,
      price: product.price,
      currency: product.currency,
      is_free: product.is_free,
      short_description: product.short_description,
    });
  }, [product, addRecent]);

  useEffect(() => {
    const buyArea = buyButtonRef.current;
    if (!buyArea) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );

    observer.observe(buyArea);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={buyButtonRef} className="sr-only" aria-hidden="true" />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-3 md:hidden ${
          showSticky ? "sticky-purchase-bar" : "translate-y-full opacity-0 pointer-events-none"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center gap-3">
          <Button
            className="flex-1 w-full h-12 text-base button-motion gap-2"
            render={
              <a
                href={`/api/track-click?product_id=${product.id}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLink className="h-5 w-5 button-icon-motion" />
            {product.is_free ? "Free Download" : `${product.price} ${product.currency}`}
          </Button>
          <FavoriteButton productId={product.id} />
        </div>
      </div>
      <div className="h-20 md:hidden" />
    </>
  );
}
