export const PROMOTIONAL_MESSAGES = [
  "✦ Special Offers",
  "✦ Fast Delivery",
  "✦ Exclusive Discounts",
  "✦ New Arrivals",
  "✦ Limited Time Offers",
] as const;

interface PromotionalMarqueeProps {
  messages?: readonly string[];
  speed?: number;
}

export function PromotionalMarquee({
  messages = PROMOTIONAL_MESSAGES,
  speed,
}: PromotionalMarqueeProps) {
  const style = speed ? { "--marquee-duration": `${speed}s` } as React.CSSProperties : undefined;

  return (
    <section
      className="promotional-marquee"
      aria-label="Current promotions"
      dir="ltr"
      style={style}
    >
      <div className="promotional-marquee__viewport">
        <div className="promotional-marquee__track">
          <div className="promotional-marquee__group">
            {messages.map((msg) => (
              <span key={msg} className="promotional-marquee__item">
                {msg}
                <span className="promotional-marquee__separator" aria-hidden="true">✦</span>
              </span>
            ))}
          </div>

          <div
            className="promotional-marquee__group"
            aria-hidden="true"
          >
            {messages.map((msg) => (
              <span key={`dup-${msg}`} className="promotional-marquee__item">
                {msg}
                <span className="promotional-marquee__separator">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
