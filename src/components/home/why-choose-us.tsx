import { ShieldCheck, Truck, RotateCcw, Headphones, CreditCard, Star } from "lucide-react";

const FEATURES = [
  {
    icon: Truck,
    title: "Fast Global Shipping",
    description: "Free delivery to Morocco and worldwide. Track every order in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Bank-level encryption protects every transaction. Shop with confidence.",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "Not satisfied? Return within 30 days for a full refund, no questions asked.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our team is always here to help via chat, email, or phone.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    description: "Pay your way — cash on delivery, cards, or online payment options.",
  },
  {
    icon: Star,
    title: "Curated Quality",
    description: "Every product is hand-selected and quality-checked before it reaches you.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 md:py-20" aria-label="Why choose us">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-[#728156]">
            Our Promise
          </span>
          <h2 className="font-heading text-[clamp(1.5rem,2vw,2rem)] font-semibold tracking-[-0.03em] text-[#1F241B]">
            Why Customers Choose Us
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-[#D7E1CC] bg-white p-6 transition-[border-color,background-color] duration-300 hover:border-[#B6C99B] hover:bg-[#F8FAF5]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F5DC] border border-[#CFE1B9] group-hover:bg-[#CFE1B9] transition-[background-color] duration-300">
                <feature.icon
                  className="h-5 w-5 text-[#55663E]"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mb-1.5 font-heading text-sm font-bold text-[#273020]">
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed text-[#66705B]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
