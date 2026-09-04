import { Truck, Tag, Clock, CircleDot } from "lucide-react";

const ITEMS = [
  { icon: Truck, text: "Shipping Available in Morocco & Internationally" },
  { icon: Tag, text: "Seasonal Offers Available" },
  { icon: Clock, text: "Limited-Time Deals" },
];

export function AnnouncementBar() {
  return (
    <section
      className="bg-[#101010] text-white"
      aria-label="Store announcements"
    >
      <div className="mx-auto flex items-center justify-center gap-4 px-4 py-2 text-xs font-medium tracking-wide sm:gap-6 sm:text-[13px]">
        {ITEMS.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
            <item.icon
              className="h-3 w-3 shrink-0 text-[#ff4b16]"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{item.text}</span>
            <span className="sm:hidden">
              {i === 0 ? "Worldwide Shipping" : item.text}
            </span>
          </span>
        ))}
        <CircleDot
          className="hidden h-1 w-1 shrink-0 text-white/30 sm:block"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
