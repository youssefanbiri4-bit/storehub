import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingCart, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/shared/favorite-button";
import type { ProductCardData } from "@/types";

interface BestSellersProps {
  products: ProductCardData[];
}

function formatPrice(price: number, currency: string) {
  return `${price} ${currency}`;
}

export function BestSellers({ products }: BestSellersProps) {
  if (products.length === 0) {
    return (
      <section className="py-16 md:py-20 bg-[#F3F7EF]" aria-label="Best Sellers">
        <div className="mx-auto max-w-[1400px] px-5">
          <div className="mb-10 text-center">
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">
              Top Picks
            </span>
            <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">
              Best Sellers
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D7E1CC] bg-white px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F5DC] border border-[#CFE1B9]">
              <Trophy className="h-5 w-5 text-[#728156]" />
            </div>
            <p className="text-sm font-medium text-[#273020]">Best-selling products coming soon</p>
            <p className="mt-1 text-xs text-[#66705B]">
              Discover what our customers love most.
            </p>
            <Link
              href="/products?sort=popular"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#55663E] hover:text-[#4A5937] transition-colors"
            >
              Browse Popular Products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-[#F3F7EF]" aria-label="Popular Products">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">
              Top Picks
            </span>
            <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">
              Popular Products
            </h2>
            <p className="text-xs text-[#66705B] mt-1">Ranked by views — not sales</p>
          </div>
          <Link
            href="/products?sort=popular"
            className="hidden items-center gap-1.5 text-sm font-semibold text-[#66705B] transition-colors hover:text-[#55663E] sm:flex"
          >
            View All Popular
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => {
            const discountPercent =
              product.old_price && product.old_price > product.price
                ? Math.round(
                    ((product.old_price - product.price) / product.old_price) *
                      100
                  )
                : 0;

            return (
              <div
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#D7E1CC] bg-white product-card-motion sm:flex-row lg:flex-col"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative shrink-0 overflow-hidden bg-[#F3F7EF] sm:w-40 lg:w-full"
                >
                  <div className="relative aspect-[4/3] overflow-hidden sm:aspect-square lg:aspect-[4/3]">
                    {product.cover_image ? (
                      <Image
                        src={product.cover_image}
                        alt={product.name}
                        fill
                        className="object-cover product-card-image"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#66705B]">
                        No image
                      </div>
                    )}
                  </div>
                  {product.badge === "bestseller" ? (
                    <Badge className="absolute top-2 left-2 bg-[#728156] text-white border-0 text-[10px] font-bold badge-enter backdrop-blur-sm">
                      Bestseller
                    </Badge>
                  ) : (
                    <Badge className="absolute top-2 left-2 bg-slate-800/80 text-white border-0 text-[10px] font-bold badge-enter backdrop-blur-sm">
                      Popular
                    </Badge>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ml-1 text-[10px] text-[#66705B]">
                      Popular
                    </span>
                  </div>

                  <Link href={`/products/${product.slug}`}>
                    <h3 className="line-clamp-1 font-heading text-base font-bold text-[#1F241B] group-hover:text-[#55663E] transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {product.short_description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#66705B]">
                      {product.short_description}
                    </p>
                  )}

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-heading text-lg font-bold text-[#1F241B]">
                      {product.is_free
                        ? "Free"
                        : formatPrice(product.price, product.currency)}
                    </span>
                    {!product.is_free && product.old_price && product.old_price > product.price && (
                      <span className="text-sm text-[#66705B] line-through">
                        {product.old_price}
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <Badge className="bg-[#E7F5DC] text-[#55663E] border border-[#CFE1B9] text-[10px] font-bold">
                        -{discountPercent}%
                      </Badge>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-3">
                    <Button
                      size="sm"
                      className="flex-1 h-9 rounded-lg bg-[#E7F5DC] text-[#55663E] hover:bg-[#CFE1B9] button-motion gap-1.5 text-xs border border-[#CFE1B9]"
                      render={<Link href={`/products/${product.slug}`} />}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                    <FavoriteButton productId={product.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products?sort=popular"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#55663E]"
          >
            View All Best Sellers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
