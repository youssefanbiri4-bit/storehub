import { Sparkles } from "lucide-react";

const TICKER_ITEMS = [
  "INSTANT DIGITAL ACCESS",
  "TEMPLATES",
  "GUIDES",
  "COURSES",
  "AI TOOLKITS",
  "CREATOR RESOURCES",
  "FREE DOWNLOADS",
  "CLEAR PRODUCT PREVIEWS",
];

function TickerItem({ item }: { item: string }) {
  return (
    <span className="flex items-center gap-6 whitespace-nowrap">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1F241B]">
        {item}
      </span>
      <Sparkles
        className="h-3 w-3 shrink-0 text-[#728156]"
        aria-hidden="true"
      />
    </span>
  );
}

export function HeroTicker() {
  return (
    <section
      className="border-y border-[#D7E1CC] bg-[#F3F7EF]"
      aria-label="Platform features"
    >
      <div className="overflow-hidden py-3">
        <div className="ticker-track">
          {Array.from({ length: 2 }).map((_, setIdx) => (
            <div
              key={setIdx}
              className="flex shrink-0 items-center gap-6 px-4"
            >
              {TICKER_ITEMS.map((item, i) => (
                <TickerItem key={`${setIdx}-${i}`} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
