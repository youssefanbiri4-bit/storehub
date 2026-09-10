import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 text-xs">System</Badge>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your store settings</p>
      </div>
      <EmptyState
        icon={Settings}
        title="Store settings coming soon"
        description="Configure payment methods, tax settings, notifications, and store preferences."
        action={{ label: "Back to Dashboard", href: "/admin" }}
      />
    </div>
  );
}
