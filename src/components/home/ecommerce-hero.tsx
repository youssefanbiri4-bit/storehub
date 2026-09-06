import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductCardData } from "@/types";

interface EcommerceHeroProps {
  heroProduct: ProductCardData | null;
  floatingProducts: ProductCardData[];
}

function FloatingProductCard({ product, className }: { product: ProductCardData; className?: string }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group block rounded-2xl border border-[#D7E1CC] bg-white p-3 shadow-[0_8px_24px_rgb(31_36_27/0.08)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(114,129,86,0.12)] hover:border-[#B6C99B] ${className || ""}`}
    >
      <div className="relative mb-2.5 aspect-[4/3] overflow-hidden rounded-xl bg-[#F3F7EF]">
        {product.cover_image ? (
          <Image
            src={product.cover_image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="180px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#66705B]">
            No image
          </div>
        )}
      </div>
      <h4 className="line-clamp-1 text-xs font-semibold text-[#1F241B]">
        {product.name}
      </h4>
      <p className="mt-1 text-xs font-bold text-[#3B472C]">
        {product.is_free
          ? "Free"
          : `${product.price} ${product.currency}`}
      </p>
    </Link>
  );
}

export function EcommerceHero({
  heroProduct,
  floatingProducts,
}: EcommerceHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#F8FAF5]" aria-label="Hero">
      {/* Background glow effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-[#CFE1B9]/[0.15] blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-[#B6C99B]/[0.10] blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-20 md:py-28 lg:py-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[42%_1fr] lg:gap-8">
          {/* Left content */}
          <div className="space-y-8">
            <div className="hero-reveal hero-reveal-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#CFE1B9] bg-[#E7F5DC] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#55663E]">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Premium Collection
              </span>
            </div>

            <h1 className="hero-reveal hero-reveal-2 font-heading text-[clamp(2.75rem,5vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#1F241B]">
              Discover Better.
              <br />
              <span className="text-[#55663E]">
                Choose Smarter.
              </span>
            </h1>

            <p className="hero-reveal hero-reveal-3 max-w-[34rem] text-base leading-relaxed text-[#66705B]">
              Curated products for modern lifestyles. Quality you can trust, delivered worldwide.
            </p>

            <div className="hero-reveal hero-reveal-4 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-13 rounded-xl bg-[#55663E] px-8 text-[15px] font-semibold text-white hover:bg-[#4A5937] button-motion gap-2 shadow-[0_8px_24px_rgb(31_36_27/0.08)] border-0"
                render={<Link href="/products" />}
              >
                Explore Products
                <ArrowRight className="h-4 w-4 button-icon-motion" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 rounded-xl border-[#CFE1B9] bg-white px-8 text-[15px] font-semibold text-[#273020] hover:bg-[#E7F5DC] hover:border-[#B6C99B] button-motion"
                render={<Link href="/products?category=fashion" />}
              >
                View Categories
              </Button>
            </div>

            <div className="hero-reveal hero-reveal-5 flex items-center gap-6 text-sm text-[#66705B]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#728156]" />
                Free shipping worldwide
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#728156]" />
                Secure checkout
              </span>
            </div>
          </div>

          {/* Right visual — hero image + floating cards */}
          <div className="relative hidden lg:block">
            {/* Background glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[#B6C99B]/[0.10] blur-[80px]"
            />

            {/* Main hero image area */}
            <div className="relative mx-auto max-w-[480px]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-[#D7E1CC] bg-white shadow-[0_20px_60px_rgb(31_36_27/0.12)]">
                {heroProduct?.cover_image ? (
                  <Image
                    src={heroProduct.cover_image}
                    alt={heroProduct.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 0vw, 480px"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div className="space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E7F5DC] border border-[#CFE1B9]">
                        <Sparkles className="h-7 w-7 text-[#728156]" />
                      </div>
                      <p className="text-sm font-medium text-[#66705B]">
                        Featured products coming soon
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating product cards */}
              {floatingProducts[0] && (
                <div className="hero-reveal hero-reveal-3 absolute -left-20 top-12 w-[170px]">
                  <FloatingProductCard product={floatingProducts[0]} />
                </div>
              )}
              {floatingProducts[1] && (
                <div className="hero-reveal hero-reveal-4 absolute -right-14 top-6 w-[170px]">
                  <FloatingProductCard product={floatingProducts[1]} />
                </div>
              )}
              {floatingProducts[2] && (
                <div className="hero-reveal hero-reveal-4 absolute -left-14 bottom-20 w-[170px]">
                  <FloatingProductCard product={floatingProducts[2]} />
                </div>
              )}
              {floatingProducts[3] && (
                <div className="hero-reveal hero-reveal-5 absolute -right-16 bottom-24 w-[170px]">
                  <FloatingProductCard product={floatingProducts[3]} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile hero image */}
        <div className="mt-14 lg:hidden">
          <div className="relative mx-auto aspect-[4/3] max-w-[400px] overflow-hidden rounded-2xl border border-[#D7E1CC] bg-white shadow-[0_16px_48px_rgb(31_36_27/0.10)]">
            {heroProduct?.cover_image ? (
              <Image
                src={heroProduct.cover_image}
                alt={heroProduct.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div className="space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F5DC] border border-[#CFE1B9]">
                    <Sparkles className="h-5 w-5 text-[#728156]" />
                  </div>
                  <p className="text-sm font-medium text-[#66705B]">
                    Featured products coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
