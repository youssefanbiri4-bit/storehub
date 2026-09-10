import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface InsightCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  description: string;
  href: string;
  actionLabel?: string;
}

export function InsightCard({ icon: Icon, iconColor, title, description, href, actionLabel = "View" }: InsightCardProps) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group"
    >
      <div className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
    </Link>
  );
}
