import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PromotionalBanners() {
  return (
    <section className="py-16 md:py-20" aria-label="Promotions">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Banner One — Seasonal Sale */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 p-8 md:p-10 border border-white/[0.06]">
            <div className="relative z-10 max-w-xs">
              <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                Limited Time
              </span>
              <h3 className="mb-2 font-heading text-2xl font-bold text-white md:text-3xl">
                Seasonal Sale
              </h3>
              <p className="mb-6 text-sm text-[#F8FAF5]/80">
                Save on selected products across the store
              </p>
              <Button
                size="lg"
                className="h-11 rounded-xl bg-white px-6 text-sm font-semibold text-brand-500 hover:bg-white/90 button-motion gap-2 border-0"
                render={<Link href="/products" />}
              >
                Shop the Sale
                <ArrowRight className="h-4 w-4 button-icon-motion" />
              </Button>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 top-4 h-20 w-20 rounded-full bg-white/5"
            />
          </div>

          {/* Banner Two — New Collection */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 md:p-10">
            <div className="relative z-10 max-w-xs">
              <span className="mb-3 inline-block rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-300">
                Just Arrived
              </span>
              <h3 className="mb-2 font-heading text-2xl font-bold text-white md:text-3xl">
                New Collection
              </h3>
              <p className="mb-6 text-sm text-[#66705B]">
                Explore the latest styles and trends
              </p>
              <Button
                size="lg"
                className="h-11 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-400 button-motion gap-2 shadow-lg shadow-brand-500/20 border-0"
                render={<Link href="/products?sort=newest" />}
              >
                Shop Collection
                <ArrowRight className="h-4 w-4 button-icon-motion" />
              </Button>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-brand-500/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-8 top-6 h-16 w-16 rounded-full bg-brand-300/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
