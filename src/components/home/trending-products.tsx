import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/shared/favorite-button";
import type { Product } from "@/types";

interface TrendingProductsProps {
  products: Product[];
}

function formatPrice(price: number, currency: string) {
  return `${price} ${currency}`;
}

export function TrendingProducts({ products }: TrendingProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-20" aria-label="Trending Products">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">
              Trending Now
            </span>
            <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">
              Popular with Customers
            </h2>
          </div>
          <Link
            href="/products?sort=popular"
            className="hidden items-center gap-1.5 text-sm font-semibold text-[#66705B] transition-colors hover:text-[#55663E] sm:flex"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {products.slice(0, 6).map((product) => (
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
                    <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                    Trending
                  </Badge>
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
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products?sort=popular"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#55663E]"
          >
            View All Trending
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
