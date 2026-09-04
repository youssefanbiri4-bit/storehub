import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Layout,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import { PRODUCT_TYPES } from "@/types";

interface FeaturedProductSectionProps {
  product: Product | null;
}

export function FeaturedProductSection({ product }: FeaturedProductSectionProps) {
  if (!product) return null;

  const typeLabel =
    PRODUCT_TYPES[product.product_type as keyof typeof PRODUCT_TYPES] ||
    product.product_type;

  return (
    <section id="featured-product" className="py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10">
          <span className="mb-3 inline-block rounded-full border border-[#cfc9bd] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#68645d]">
            Featured Product
          </span>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#111] md:text-3xl">
            Editor&apos;s Pick
          </h2>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-[#cfc9bd] bg-[#151517] p-8 md:grid-cols-2 md:p-12">
          {/* Product visual */}
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#1e1e1e]">
              {product.cover_image ? (
                <Image
                  src={product.cover_image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/30">
                  Product Preview
                </div>
              )}
            </div>
            {/* Decorative accent */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-[#7b5cff]/20 blur-xl"
            />
          </div>

          {/* Product info */}
          <div className="space-y-6">
            <div>
              <span className="mb-2 inline-block rounded-md bg-[#7b5cff]/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#a78bfa]">
                {typeLabel}
              </span>
              <h3 className="mt-3 font-heading text-2xl font-bold text-white md:text-3xl">
                {product.name}
              </h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
                {product.short_description ||
                  "A comprehensive digital product designed to elevate your workflow and deliver professional results."}
              </p>
            </div>

            {/* Feature labels */}
            <div className="flex flex-wrap gap-2">
              {[FileText, Layout, ClipboardList].map((Icon, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70"
                >
                  <Icon className="h-3.5 w-3.5 text-[#7b5cff]" aria-hidden="true" />
                  {["Guide", "Worksheets", "Templates"][i]}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-3xl font-bold text-[#a78bfa]">
                {product.is_free
                  ? "Free"
                  : `${product.price} ${product.currency}`}
              </span>
              {!product.is_free && product.old_price && product.old_price > product.price && (
                <span className="text-sm text-white/40 line-through">
                  {product.old_price} {product.currency}
                </span>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 rounded-xl bg-[#dfff45] px-7 text-[15px] font-semibold text-[#111] hover:bg-[#d2f637] button-motion gap-2"
                render={
                  <a
                    href={`/api/track-click?product_id=${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ExternalLink className="h-4 w-4" />
                {product.is_free ? "Download Free" : "Get Product"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-white/15 bg-white/5 px-7 text-[15px] font-semibold text-white hover:bg-white/10 button-motion"
                render={<Link href={`/products/${product.slug}`}>View Details</Link>}
              >
                View Details
                <ArrowRight className="h-4 w-4 button-icon-motion" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
