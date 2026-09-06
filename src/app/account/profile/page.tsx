import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account/profile");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="max-w-2xl">
      <Badge variant="outline" className="mb-3 text-xs">
        Profile
      </Badge>
      <h1 className="text-2xl font-bold mb-2 font-heading">Edit Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">Update your personal information.</p>

      <ProfileForm
        initialFullName={profile?.full_name || ""}
        initialPhone={profile?.phone || ""}
        email={user.email || ""}
      />
    </div>
  );
}
