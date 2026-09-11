import Link from "next/link";
import { ArrowRight } from "lucide-react";

const CATEGORIES = [
  {
    name: "Fashion",
    description: "Clothing, accessories, and wearable collections",
    count: "30+",
    color: "bg-[#7b5cff]/10",
    textColor: "text-[#7b5cff]",
  },
  {
    name: "Electronics",
    description: "Gadgets, devices, and tech accessories",
    count: "20+",
    color: "bg-[#dfff45]/20",
    textColor: "text-[#111]",
  },
  {
    name: "Beauty",
    description: "Skincare, cosmetics, and grooming essentials",
    count: "15+",
    color: "bg-[#7b5cff]/10",
    textColor: "text-[#7b5cff]",
  },
  {
    name: "Fitness",
    description: "Equipment, gear, and wellness products",
    count: "25+",
    color: "bg-[#e8defe]",
    textColor: "text-[#7b5cff]",
  },
  {
    name: "Home Decor",
    description: "Furniture, lighting, and decorative pieces",
    count: "18+",
    color: "bg-[#dfff45]/20",
    textColor: "text-[#111]",
  },
  {
    name: "Accessories",
    description: "Bags, wallets, and everyday carry items",
    count: "22+",
    color: "bg-[#7b5cff]/10",
    textColor: "text-[#7b5cff]",
  },
  {
    name: "Sports",
    description: "Outdoor gear and athletic equipment",
    count: "12+",
    color: "bg-[#e8defe]",
    textColor: "text-[#7b5cff]",
  },
  {
    name: "New Arrivals",
    description: "Freshly stocked products across all categories",
    count: "10+",
    color: "bg-[#dfff45]/20",
    textColor: "text-[#111]",
  },
];

export function CategoriesSection() {
  return (
    <section className="py-16 md:py-20 bg-[#f6f3ec]">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#cfc9bd] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#68645d]">
              Browse by Type
            </span>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-[#111] md:text-3xl">
              Product Categories
            </h2>
            <p className="mt-1 text-[#68645d]">
              Find exactly what you need for your next project
            </p>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-1.5 text-sm font-semibold text-[#111] transition-colors hover:text-[#7b5cff] sm:flex"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group rounded-2xl border border-[#cfc9bd] bg-white p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#111]/20 hover:shadow-lg"
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${cat.color}`}
              >
                <span
                  className={`text-lg font-bold ${cat.textColor}`}
                  aria-hidden="true"
                >
                  {cat.name.charAt(0)}
                </span>
              </div>
              <h3 className="mb-1 font-heading text-sm font-bold text-[#111]">
                {cat.name}
              </h3>
              <p className="mb-3 text-xs leading-relaxed text-[#68645d]">
                {cat.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7b5cff]">
                  {cat.count} products
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#cfc9bd] transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-[#111]" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
