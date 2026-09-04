import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { Product } from "@/types";
import { PRODUCT_TYPES } from "@/types";

interface HeroProductShowcaseProps {
  featuredProduct: Product | null;
  supportingProducts: Product[];
  freeProduct: Product | null;
}

function FeaturedCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative z-10 block w-full max-w-[380px] rounded-2xl border border-[#D7E1CC] bg-white p-5 shadow-[0_24px_60px_rgb(31_36_27/0.12)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_32px_70px_rgb(31_36_27/0.16)]"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-[#E7F5DC] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#55663E]">
          {product.category?.name || PRODUCT_TYPES[product.product_type as keyof typeof PRODUCT_TYPES] || "Product"}
        </span>
      </div>

      <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-[#F3F7EF]">
        {product.cover_image ? (
          <Image
            src={product.cover_image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 380px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#66705B]">
            Preview
          </div>
        )}
      </div>

      <h3 className="mb-1.5 font-heading text-[17px] font-bold leading-tight text-[#1F241B]">
        {product.name}
      </h3>
      <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-[#66705B]">
        {product.short_description}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {["Format", "Resources", "Templates"].map((label) => (
          <span
            key={label}
            className="rounded-md border border-[#D7E1CC] bg-[#F8FAF5] px-2 py-0.5 text-[10px] font-medium text-[#66705B]"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[#D7E1CC] pt-3">
        <span className="font-heading text-lg font-bold text-[#3B472C]">
          {product.is_free ? "Free" : `${product.price} ${product.currency}`}
        </span>
        <span className="flex items-center gap-1 text-xs text-[#66705B] transition-colors group-hover:text-[#55663E]">
          View
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function SupportingCard({ product }: { product: Product }) {
  const typeLabel = PRODUCT_TYPES[product.product_type as keyof typeof PRODUCT_TYPES] || "Product";
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block w-full max-w-[220px] rounded-xl border border-[#D7E1CC] bg-white p-3 shadow-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-[#B6C99B] hover:shadow-md"
    >
      <div className="relative mb-2.5 aspect-[4/3] overflow-hidden rounded-lg bg-[#F3F7EF]">
        {product.cover_image ? (
          <Image
            src={product.cover_image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="220px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#66705B]">
            No image
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-md bg-[#E7F5DC] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#55663E]">
          {typeLabel}
        </span>
      </div>
      <h4 className="mb-0.5 line-clamp-1 font-heading text-sm font-semibold text-[#1F241B]">
        {product.name}
      </h4>
      <p className="line-clamp-1 text-[11px] text-[#66705B]">
        {product.short_description}
      </p>
      <div className="mt-2">
        <span className="text-sm font-bold text-[#3B472C]">
          {product.is_free ? "Free" : `${product.price} ${product.currency}`}
        </span>
      </div>
    </Link>
  );
}

function FreeCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-[#CFE1B9] bg-[#E7F5DC] px-4 py-3 transition-[border-color,background-color] duration-300 hover:border-[#B6C99B] hover:bg-[#CFE1B9]"
    >
      <span className="inline-flex items-center gap-1 rounded-full bg-[#55663E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
        Free
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-heading text-sm font-semibold text-[#1F241B]">
          {product.name}
        </p>
        <p className="line-clamp-1 text-[11px] text-[#66705B]">
          {product.short_description}
        </p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-[#66705B] transition-colors group-hover:text-[#1F241B]" />
    </Link>
  );
}

export function HeroProductShowcase({
  featuredProduct,
  supportingProducts,
  freeProduct,
}: HeroProductShowcaseProps) {
  return (
    <div className="relative">
      {/* Decorative olive circle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -left-8 h-[320px] w-[320px] rounded-full bg-[#B6C99B]/[0.08] blur-2xl"
      />

      <div className="relative flex flex-col items-center gap-4">
        {/* Top row: two supporting cards */}
        <div className="flex w-full justify-center gap-4 lg:justify-end">
          {supportingProducts[0] && (
            <div className="hero-reveal hero-reveal-4 -translate-y-2">
              <SupportingCard product={supportingProducts[0]} />
            </div>
          )}
          {supportingProducts[1] && (
            <div className="hero-reveal hero-reveal-5 translate-y-4">
              <SupportingCard product={supportingProducts[1]} />
            </div>
          )}
        </div>

        {/* Main featured card */}
        <div className="hero-reveal hero-reveal-3 w-full max-w-[380px]">
          {featuredProduct ? (
            <FeaturedCard product={featuredProduct} />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-[#D7E1CC] bg-white text-sm text-[#66705B]">
              Featured product
            </div>
          )}
        </div>

        {/* Free resource card */}
        {freeProduct && (
          <div className="hero-reveal hero-reveal-5 w-full max-w-[340px]">
            <FreeCard product={freeProduct} />
          </div>
        )}
      </div>
    </div>
  );
}
