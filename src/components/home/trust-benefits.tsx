import { Gem, Truck, ShieldCheck, ThumbsUp } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Gem,
    title: "Quality Products",
    description: "Curated items you can trust",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    description: "Shipped with care worldwide",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    description: "Safe and protected payments",
  },
  {
    icon: ThumbsUp,
    title: "Customer Satisfaction",
    description: "Your happiness is our priority",
  },
];

export function TrustBenefits() {
  return (
    <section className="border-t border-white/[0.06] bg-white/[0.02]" aria-label="Trust and quality">
      <div className="mx-auto max-w-[1400px] px-5 py-10">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {TRUST_ITEMS.map((item, i) => (
            <div
              key={item.title}
              className={`flex flex-col items-center text-center ${
                i < TRUST_ITEMS.length - 1
                  ? "md:border-r md:border-white/[0.06]"
                  : ""
              }`}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                <item.icon
                  className="h-5 w-5 text-white/70"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-sm font-semibold text-white/90">
                {item.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
