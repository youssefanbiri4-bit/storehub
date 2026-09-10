import { Badge } from "@/components/ui/badge";

type StatusType = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  status: StatusType;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  info: "bg-info/10 text-info border-info/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ label, status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={`${statusStyles[status]} ${className ?? ""}`}>
      {label}
    </Badge>
  );
}
