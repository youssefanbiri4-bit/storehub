import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/shared/favorite-button";
import type { Product } from "@/types";

interface NewArrivalsProps {
  products: Product[];
}

function formatPrice(price: number, currency: string) {
  return `${price} ${currency}`;
}

export function NewArrivals({ products }: NewArrivalsProps) {
  if (products.length === 0) {
    return (
      <section className="py-16 md:py-20" aria-label="New Arrivals">
        <div className="mx-auto max-w-[1400px] px-5">
          <div className="mb-10 text-center">
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">
              Just In
            </span>
            <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">
              New Arrivals
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D7E1CC] bg-white px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F5DC] border border-[#CFE1B9]">
              <Sparkles className="h-5 w-5 text-[#728156]" />
            </div>
            <p className="text-sm font-medium text-[#273020]">New products are coming soon</p>
            <p className="mt-1 text-xs text-[#66705B]">
              Explore the catalog while we prepare the latest arrivals.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#55663E] hover:text-[#4A5937] transition-colors"
            >
              Browse Products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20" aria-label="New Arrivals">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">
              Just In
            </span>
            <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">
              New Arrivals
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="hidden items-center gap-1.5 text-sm font-semibold text-[#66705B] transition-colors hover:text-[#55663E] sm:flex"
          >
            View All New Arrivals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {products.slice(0, 6).map((product) => {
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
                className="group rounded-xl border border-[#D7E1CC] bg-white overflow-hidden product-card-motion"
              >
                <div className="relative">
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F7EF]">
                      {product.cover_image ? (
                        <Image
                          src={product.cover_image}
                          alt={product.name}
                          fill
                          className="object-cover product-card-image"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-[#66705B]">
                          No image
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <Badge className="bg-[#728156] text-white border-0 text-[10px] font-bold badge-enter backdrop-blur-sm">
                      New
                    </Badge>
                    {discountPercent > 0 && (
                      <Badge className="bg-[#E7F5DC] text-[#55663E] border border-[#CFE1B9] text-[10px] font-bold badge-enter">
                        -{discountPercent}%
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <FavoriteButton productId={product.id} />
                  </div>
                </div>

                <div className="p-3">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="line-clamp-1 text-sm font-semibold text-[#273020] group-hover:text-[#55663E] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1F241B]">
                      {product.is_free
                        ? "Free"
                        : formatPrice(product.price, product.currency)}
                    </span>
                    {!product.is_free && product.old_price && product.old_price > product.price && (
                      <span className="text-xs text-[#66705B] line-through">
                        {product.old_price}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="mt-2.5 h-8 w-full rounded-lg bg-[#E7F5DC] text-[#55663E] hover:bg-[#CFE1B9] button-motion gap-1.5 text-xs border border-[#CFE1B9]"
                    render={
                      <Link href={`/products/${product.slug}`} />
                    }
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products?sort=newest"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#55663E]"
          >
            View All New Arrivals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
