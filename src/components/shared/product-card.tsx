"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import type { ProductCardData } from "@/types";
import { minorToMajor, formatPriceAmount } from "@/lib/pricing";

interface ProductCardProps {
  product: ProductCardData;
}

function formatPrice(amount: number, currency: string): string {
  return formatPriceAmount(amount, currency);
}

export function ProductCard({ product }: ProductCardProps) {
  const currency = product.currency || "MAD";
  const currentPrice = product.base_price_minor !== null && product.base_price_minor !== undefined
    ? (minorToMajor(product.base_price_minor, currency) ?? product.price)
    : product.price;

  const oldPrice = product.compare_at_price_minor !== null && product.compare_at_price_minor !== undefined
    ? (minorToMajor(product.compare_at_price_minor, currency) ?? product.old_price)
    : product.old_price;

  const discountPercent =
    typeof oldPrice === "number" && typeof currentPrice === "number" && oldPrice > currentPrice
      ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
      : 0;

  const isNew = product.badge === "new";
  const isBestSeller = product.badge === "bestseller";
  const hasDiscount = discountPercent > 0;
  // currency already defined above

  return (
    <div className="group rounded-2xl border border-[#D7E1CC] bg-white overflow-hidden product-card-motion">
      {/* Image area */}
      <div className="relative">
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F7EF]">
            {product.cover_image ? (
              <Image
                src={product.cover_image}
                alt={product.name}
                fill
                className="object-cover product-card-image"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#66705B] text-sm">
                No image
              </div>
            )}
          </div>
        </Link>

        {/* Badges — top left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {hasDiscount && (
            <Badge className="bg-rose-500/90 text-white border-0 text-[10px] font-bold badge-enter backdrop-blur-sm shadow-lg shadow-rose-500/20">
              -{discountPercent}%
            </Badge>
          )}
          {isNew && (
            <Badge className="bg-[#728156] text-white border-0 text-[10px] font-bold badge-enter backdrop-blur-sm shadow-lg shadow-[#728156]/20 gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              New
            </Badge>
          )}
          {isBestSeller && (
            <Badge className="bg-amber-500/90 text-white border-0 text-[10px] font-bold badge-enter backdrop-blur-sm shadow-lg shadow-amber-500/20 gap-1">
              <TrendingUp className="h-2.5 w-2.5" />
              Best Seller
            </Badge>
          )}
        </div>

        {/* Wishlist — top right */}
        <div className="absolute top-2 right-2">
          <div className="rounded-full bg-black/40 backdrop-blur-sm">
            <FavoriteButton productId={product.id} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category */}
        {product.category && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#728156]">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-[15px] line-clamp-2 group-hover:text-[#55663E] transition-colors duration-[var(--motion-fast)] text-[#1F241B] leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        {product.short_description && (
          <p className="text-xs text-[#66705B] line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        )}

        {/* Price + CTA row */}
        <div className="flex items-end justify-between pt-2 border-t border-[#D7E1CC]">
          <div className="flex flex-col">
            {product.is_free ? (
              <span className="text-lg font-bold text-[#55663E]">Free</span>
            ) : (
              <>
                <span className="text-lg font-bold text-[#3B472C] leading-tight">
                  {formatPrice(currentPrice, currency)}
                </span>
                {hasDiscount && oldPrice && (
                  <span className="text-xs text-[#66705B] line-through">
                    {formatPrice(oldPrice, currency)}
                  </span>
                )}
              </>
            )}
          </div>

          <Button
            size="sm"
            className="h-9 rounded-xl bg-[#55663E] text-white hover:bg-[#4A5937] button-motion gap-1.5 text-xs font-semibold shadow-[0_8px_24px_rgb(31_36_27/0.08)]"
            render={<Link href={`/products/${product.slug}`} />}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        </div>
      </div>
    </div>
  );
}
