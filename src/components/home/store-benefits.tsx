import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

const BENEFITS = [
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "Available in Morocco and internationally",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Protected online checkout",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "Return policy applies",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "Support when you need help",
  },
];

export function StoreBenefits() {
  return (
    <section className="border-y border-[#D7E1CC] bg-[#F8FAF5]" aria-label="Store benefits">
      <div className="mx-auto max-w-[1400px] px-5 py-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {BENEFITS.map((benefit, i) => (
            <div
              key={benefit.title}
              className={`flex items-center gap-3 ${
                i < BENEFITS.length - 1
                  ? "md:border-r md:border-[#D7E1CC] md:pr-6"
                  : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F5DC] border border-[#CFE1B9]">
                <benefit.icon
                  className="h-5 w-5 text-[#55663E]"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F241B]">
                  {benefit.title}
                </p>
                <p className="text-xs text-[#66705B]">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
