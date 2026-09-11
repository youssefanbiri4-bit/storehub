import {
  FileText,
  Eye,
  BookOpen,
  Monitor,
  Shield,
  Zap,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

const VALUE_PROPS = [
  {
    icon: FileText,
    title: "Quality Materials",
    description: "Every product is made with premium materials and rigorous quality control.",
  },
  {
    icon: Eye,
    title: "Product Previews",
    description: "See exactly what you're getting with detailed product imagery.",
  },
  {
    icon: BookOpen,
    title: "Clear Specifications",
    description: "Complete product details including dimensions, materials, and care instructions.",
  },
  {
    icon: Monitor,
    title: "Size Guides",
    description: "Know which size fits best with our comprehensive size charts.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "All transactions are protected with industry-standard encryption.",
  },
  {
    icon: Zap,
    title: "Fast Shipping",
    description: "Quick and reliable delivery to your doorstep.",
  },
  {
    icon: ExternalLink,
    title: "Easy Returns",
    description: "Hassle-free return policy if you're not completely satisfied.",
  },
  {
    icon: CheckCircle,
    title: "Curated Quality",
    description: "Every product is reviewed before being listed.",
  },
];

export function ProductValueSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="max-w-3xl">
          <span className="mb-3 inline-block rounded-full border border-[#cfc9bd] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#68645d]">
            Why Choose Us
          </span>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#111] md:text-3xl">
            More than a product.
            <br />A product you can actually use.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#68645d]">
            Every product in our marketplace is built with real quality
            in mind. Not just items — but products that fit into how you already
            live, work, and create.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((prop) => {
            const Icon = prop.icon;
            return (
              <div
                key={prop.title}
                className="group rounded-2xl border border-[#cfc9bd] bg-white p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-[#111]/15 hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f1e9] text-[#111] transition-colors group-hover:bg-[#111] group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mb-1.5 font-heading text-sm font-bold text-[#111]">
                  {prop.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-[#68645d]">
                  {prop.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
