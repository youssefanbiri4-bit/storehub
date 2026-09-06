import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AddressesManager } from "@/components/account/addresses-manager";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account/addresses");

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl">
      <Badge variant="outline" className="mb-3 text-xs">Addresses</Badge>
      <h1 className="text-2xl font-bold font-heading mb-2">My Addresses</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your shipping addresses.</p>
      <AddressesManager initialAddresses={(addresses as never) || []} />
    </div>
  );
}
