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
    title: "Clear File Formats",
    description: "Every product lists compatible file types before you download.",
  },
  {
    icon: Eye,
    title: "Product Previews",
    description: "See exactly what you're getting with detailed cover artwork.",
  },
  {
    icon: BookOpen,
    title: "Usage Instructions",
    description: "Included guides help you get started immediately.",
  },
  {
    icon: Monitor,
    title: "Compatibility Details",
    description: "Know which tools and devices each product works with.",
  },
  {
    icon: Shield,
    title: "Licensing Information",
    description: "Transparent usage rights on every product page.",
  },
  {
    icon: Zap,
    title: "Fast Online Access",
    description: "Instant digital delivery after external checkout.",
  },
  {
    icon: ExternalLink,
    title: "Transparent Checkout",
    description: "External purchase links with clear pricing and terms.",
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
            More than a download.
            <br />A product you can actually use.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#68645d]">
            Every digital product in our marketplace is built with real workflows
            in mind. Not just files — but tools that fit into how you already
            create, ship, and scale.
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
