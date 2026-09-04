import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Grid3X3 } from "lucide-react";
import type { Category } from "@/types";

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <section className="py-16 md:py-20 bg-[#F3F7EF]" aria-label="Categories">
        <div className="mx-auto max-w-[1400px] px-5">
          <div className="mb-10 text-center">
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">
              Browse
            </span>
            <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">
              Shop by Category
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D7E1CC] bg-white px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F5DC] border border-[#CFE1B9]">
              <Grid3X3 className="h-5 w-5 text-[#728156]" />
            </div>
            <p className="text-sm font-medium text-[#1F241B]">Categories coming soon</p>
            <p className="mt-1 text-xs text-[#66705B]">We&apos;re curating the perfect collection for you.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-[#F3F7EF]" aria-label="Categories">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">
              Browse
            </span>
            <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-1.5 text-sm font-semibold text-[#66705B] transition-colors hover:text-[#55663E] sm:flex"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group overflow-hidden rounded-xl border border-[#D7E1CC] bg-white transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#B6C99B] hover:shadow-lg hover:shadow-[#728156]/10"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F7EF]">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl font-bold text-[#B6C99B]">
                    {category.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-3 text-center">
                <h3 className="text-sm font-semibold text-[#273020]">
                  {category.name}
                </h3>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-[#55663E] transition-colors group-hover:gap-1.5">
                  Shop Now
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#55663E]"
          >
            View All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
