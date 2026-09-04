import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/product-card";
import type { Product } from "@/types";

interface PopularProductsSectionProps {
  products: Product[];
}

export function PopularProductsSection({
  products,
}: PopularProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-[#f4f1e9]">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#cfc9bd] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#68645d]">
              Most Popular
            </span>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-[#111] md:text-3xl">
              Popular Digital Products
            </h2>
            <p className="mt-1 text-[#68645d]">
              Our best-selling templates, guides, and toolkits
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden gap-2 button-motion sm:inline-flex"
            render={<Link href="/products?sort=popular" />}
          >
            View All
            <ArrowRight className="h-3.5 w-3.5 button-icon-motion" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 button-motion"
            render={<Link href="/products?sort=popular" />}
          >
            View All Products
            <ArrowRight className="h-3.5 w-3.5 button-icon-motion" />
          </Button>
        </div>
      </div>
    </section>
  );
}
