import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SecurityClient } from "@/components/account/security-client";

export const metadata = { title: "Security" };

export default async function SecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account/security");

  return (
    <div className="max-w-2xl">
      <Badge variant="outline" className="mb-3 text-xs">Security</Badge>
      <h1 className="text-2xl font-bold font-heading mb-2">Security</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your account security and password.</p>
      <SecurityClient email={user.email || ""} />
    </div>
  );
}
