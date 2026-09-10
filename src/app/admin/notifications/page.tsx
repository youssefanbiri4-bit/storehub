import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-xs">System</Badge>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">View system alerts and notifications</p>
      </div>
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="You&apos;re all caught up! Notifications about orders, stock, and system events will appear here."
        action={{ label: "Back to Dashboard", href: "/admin" }}
      />
    </div>
  );
}
