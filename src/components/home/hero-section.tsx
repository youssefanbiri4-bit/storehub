import type { ProductCardData } from "@/types";
import { HeroContent } from "./hero-content";
import { HeroProductShowcase } from "./hero-product-showcase";
import { HeroTicker } from "./hero-ticker";

interface HeroSectionProps {
  featuredProduct: ProductCardData | null;
  supportingProducts: ProductCardData[];
  freeProduct: ProductCardData | null;
}

export function HeroSection({
  featuredProduct,
  supportingProducts,
  freeProduct,
}: HeroSectionProps) {
  return (
    <div>
      <section className="relative overflow-hidden bg-[#F8FAF5]">
        <div className="mx-auto max-w-[1400px] px-5 py-16 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[46%_1fr] lg:gap-8">
            <HeroContent />

            <div className="relative hidden lg:block">
              <HeroProductShowcase
                featuredProduct={featuredProduct}
                supportingProducts={supportingProducts}
                freeProduct={freeProduct}
              />
            </div>
          </div>

          {/* Mobile product showcase */}
          <div className="mt-12 lg:hidden">
            <HeroProductShowcase
              featuredProduct={featuredProduct}
              supportingProducts={supportingProducts}
              freeProduct={freeProduct}
            />
          </div>
        </div>
      </section>

      <HeroTicker />
    </div>
  );
}
