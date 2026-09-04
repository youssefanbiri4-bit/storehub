import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  FileText,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroContent() {
  return (
    <div className="space-y-7">
      <div className="hero-reveal hero-reveal-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE1B9] bg-[#E7F5DC] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#55663E]">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Curated Digital Products
        </span>
      </div>

      <h1 className="hero-reveal hero-reveal-2 font-heading text-[clamp(2.625rem,5.5vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.055em] text-[#1F241B]">
        Tools that
        <br />
        move your
        <br />
        work forward.
      </h1>

      <p className="hero-reveal hero-reveal-3 max-w-[580px] text-[17px] leading-relaxed text-[#66705B] md:text-lg">
        Discover premium templates, practical guides, online courses, AI
        resources, and digital tools designed to help you create faster and work
        smarter.
      </p>

      <div className="hero-reveal hero-reveal-4 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="h-12 rounded-xl bg-[#55663E] px-7 text-[15px] font-semibold text-white hover:bg-[#4A5937] button-motion gap-2"
          render={<Link href="/products" />}
        >
          Explore Products
          <ArrowRight className="h-4 w-4 button-icon-motion" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12 rounded-xl border-[#CFE1B9] bg-white px-7 text-[15px] font-semibold text-[#273020] hover:bg-[#E7F5DC] button-motion"
          render={<a href="#featured-product">View Featured</a>}
        >
          View Featured
        </Button>
      </div>

      <div className="hero-reveal hero-reveal-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#66705B]">
        <span className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-[#55663E]" aria-hidden="true" />
          Instant Digital Access
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-[#55663E]" aria-hidden="true" />
          Clear Product Previews
        </span>
        <span className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-[#55663E]" aria-hidden="true" />
          Multiple Digital Formats
        </span>
      </div>
    </div>
  );
}
