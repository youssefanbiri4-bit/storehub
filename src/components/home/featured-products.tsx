import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import type { Product } from "@/types";

interface FeaturedProductsProps {
  products: Product[];
}

function formatPrice(price: number, currency: string) {
  return `${price} ${currency}`;
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) {
    return (
      <section className="py-16 md:py-20" aria-label="Featured Products">
        <div className="mx-auto max-w-[1400px] px-5">
          <div className="mb-10 text-center">
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">Editor&apos;s Pick</span>
            <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">Featured Products</h2>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D7E1CC] bg-white px-6 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F5DC] border border-[#CFE1B9]">
              <Star className="h-5 w-5 text-[#728156]" />
            </div>
            <p className="text-sm font-medium text-[#273020]">Featured products coming soon</p>
            <p className="mt-1 text-xs text-[#66705B]">We&apos;re selecting the best products for you.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20" aria-label="Featured Products">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">
              Editor&apos;s Pick
            </span>
            <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">
              Featured Products
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-1.5 text-sm font-semibold text-[#66705B] transition-colors hover:text-[#55663E] sm:flex"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-2xl border border-[#D7E1CC] bg-white product-card-motion"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F7EF]">
                  {product.cover_image ? (
                    <Image
                      src={product.cover_image}
                      alt={product.name}
                      fill
                      className="object-cover product-card-image"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#66705B]">
                      No image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>

              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <Badge className="bg-[#55663E] text-white border-0 text-[10px] font-bold badge-enter backdrop-blur-sm">
                  Featured
                </Badge>
              </div>

              <div className="absolute top-3 right-3">
                <FavoriteButton productId={product.id} />
              </div>

              <div className="p-5">
                <div className="mb-2 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <Link href={`/products/${product.slug}`}>
                  <h3 className="line-clamp-1 font-heading text-base font-bold text-[#1F241B] group-hover:text-[#55663E] transition-colors">
                    {product.name}
                  </h3>
                </Link>
                {product.short_description && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#66705B]">
                    {product.short_description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-heading text-lg font-bold text-[#1F241B]">
                    {product.is_free
                      ? "Free"
                      : formatPrice(product.price, product.currency)}
                  </span>
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-[#E7F5DC] text-[#55663E] hover:bg-[#CFE1B9] button-motion text-xs border border-[#CFE1B9]"
                    render={<Link href={`/products/${product.slug}`} />}
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#55663E]"
          >
            View All Featured
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
