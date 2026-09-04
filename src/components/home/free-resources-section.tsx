import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import { PRODUCT_TYPES } from "@/types";

interface FreeResourcesSectionProps {
  products: Product[];
}

export function FreeResourcesSection({
  products,
}: FreeResourcesSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-[#f4f1e9]">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-[#c8e06a] bg-[#eef7b5] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#3a3a00]">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              No Cost
            </span>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-[#111] md:text-3xl">
              Free Resources for Creators
            </h2>
            <p className="mt-1 text-[#68645d]">
              Quality starter assets to help you get going — no strings attached
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden gap-2 button-motion sm:inline-flex"
            render={<Link href="/products?price=free" />}
          >
            View All Free
            <ArrowRight className="h-3.5 w-3.5 button-icon-motion" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 3).map((product) => {
            const typeLabel =
              PRODUCT_TYPES[
                product.product_type as keyof typeof PRODUCT_TYPES
              ] || product.product_type;

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group overflow-hidden rounded-2xl border border-[#cfc9bd] bg-white transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#c8e06a] hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#f4f1e9]">
                  {product.cover_image ? (
                    <Image
                      src={product.cover_image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#68645d]">
                      No image
                    </div>
                  )}
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#dfff45] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#111]">
                    <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                    Free
                  </span>
                </div>

                <div className="p-5">
                  <span className="mb-2 inline-block rounded bg-[#7b5cff]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#7b5cff]">
                    {typeLabel}
                  </span>
                  <h3 className="mb-1 font-heading text-base font-bold text-[#111]">
                    {product.name}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[#68645d]">
                    {product.short_description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111] transition-colors group-hover:text-[#7b5cff]">
                    Get it Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
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
            render={<Link href="/products?price=free" />}
          >
            View All Free Resources
            <ArrowRight className="h-3.5 w-3.5 button-icon-motion" />
          </Button>
        </div>
      </div>
    </section>
  );
}
