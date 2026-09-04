import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-16 md:py-20" aria-label="Call to action">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#2F3928] via-[#3B472C] to-[#55663E] p-10 md:p-16">
          {/* Background glow effects */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-brand-500/15 blur-[80px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-brand-300/10 blur-[80px]"
          />

          <div className="relative z-10 text-center">
            <h2 className="mb-4 font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-bold tracking-[-0.03em] text-[#FFFFFF]">
              Ready to Discover Something
              <br />
              <span className="bg-gradient-to-r from-brand-200 to-brand-300 bg-clip-text text-transparent">
                Extraordinary?
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-sm leading-relaxed text-[#DCE7D2]">
              Browse our curated collection of premium products. From fashion to
              electronics, find exactly what you&apos;re looking for.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 rounded-xl bg-[#E7F5DC] px-8 text-[15px] font-semibold text-[#273020] hover:bg-[#CFE1B9] button-motion gap-2 shadow-[0_8px_24px_rgb(31_36_27/0.08)] border-0"
                render={<Link href="/products" />}
              >
                Shop Now
                <ArrowRight className="h-4 w-4 button-icon-motion" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-white/25 bg-transparent px-8 text-[15px] font-semibold text-white hover:bg-white/10 hover:border-white/40 button-motion"
                render={<Link href="/about" />}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
