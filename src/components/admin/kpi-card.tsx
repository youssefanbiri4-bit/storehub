import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subtitle?: string;
}

export function KpiCard({ title, value, change, changeLabel, icon: Icon, href, subtitle }: KpiCardProps) {
  const trend = change !== undefined ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : null;

  const content = (
    <div className="rounded-xl border border-border bg-surface p-4 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              trend === "up"
                ? "bg-success/10 text-success"
                : trend === "down"
                ? "bg-danger/10 text-danger"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span>{Math.abs(change!)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          {changeLabel && (
            <p className="text-[11px] text-muted-foreground">{changeLabel}</p>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
