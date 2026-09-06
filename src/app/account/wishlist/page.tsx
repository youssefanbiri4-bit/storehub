import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { WishlistClient } from "@/components/account/wishlist-client";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account/wishlist");

  return (
    <div className="max-w-4xl">
      <Badge variant="outline" className="mb-3 text-xs">Wishlist</Badge>
      <h1 className="text-2xl font-bold font-heading mb-2">My Wishlist</h1>
      <p className="text-sm text-muted-foreground mb-6">Products you&apos;ve saved for later.</p>
      <WishlistClient />
    </div>
  );
}
