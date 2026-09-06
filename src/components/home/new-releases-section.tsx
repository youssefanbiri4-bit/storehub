import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductCardData } from "@/types";
import { PRODUCT_TYPES } from "@/types";

interface NewReleasesSectionProps {
  products: ProductCardData[];
}

export function NewReleasesSection({ products }: NewReleasesSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#cfc9bd] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#68645d]">
              Just Added
            </span>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-[#111] md:text-3xl">
              New Releases
            </h2>
            <p className="mt-1 text-[#68645d]">
              Recently added digital products
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden gap-2 button-motion sm:inline-flex"
            render={<Link href="/products?sort=newest" />}
          >
            View All
            <ArrowRight className="h-3.5 w-3.5 button-icon-motion" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((product) => {
            const typeLabel =
              PRODUCT_TYPES[
                product.product_type as keyof typeof PRODUCT_TYPES
              ] || product.product_type;

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group flex gap-4 rounded-2xl border border-[#cfc9bd] bg-white p-4 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-[#111]/20 hover:shadow-md"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f4f1e9]">
                  {product.cover_image ? (
                    <Image
                      src={product.cover_image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#68645d]">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="mb-1 inline-block rounded bg-[#7b5cff]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#7b5cff]">
                    {typeLabel}
                  </span>
                  <h3 className="mb-0.5 line-clamp-1 font-heading text-sm font-bold text-[#111]">
                    {product.name}
                  </h3>
                  <p className="mb-2 line-clamp-1 text-xs text-[#68645d]">
                    {product.short_description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-sm font-bold text-[#7b5cff]">
                      {product.is_free
                        ? "Free"
                        : `${product.price} ${product.currency}`}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#68645d]">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      New
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 button-motion"
            render={<Link href="/products?sort=newest" />}
          >
            View All New Releases
            <ArrowRight className="h-3.5 w-3.5 button-icon-motion" />
          </Button>
        </div>
      </div>
    </section>
  );
}
