"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, LogOut } from "lucide-react";

export function SecurityClient({ email }: { email: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError("Could not update password. Please try again.");
      } else {
        setSuccess("Password updated successfully.");
        setNewPassword("");
        setConfirm("");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Could not update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-sm mb-1">Account Information</h2>
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="font-medium text-sm mt-1 break-all">{email}</p>
      </div>

      <form onSubmit={handlePasswordChange} className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <h2 className="font-semibold text-sm">Change Password</h2>
        <p className="text-xs text-muted-foreground">Use a strong password you don&apos;t use elsewhere.</p>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm New Password</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" required />
        </div>

        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-sm mb-1">Sign Out</h2>
        <p className="text-xs text-muted-foreground mb-3">Sign out from this device.</p>
        <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut} className="gap-2">
          <LogOut className="h-4 w-4" /> {signingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground">
          Your session is protected by Supabase Auth. Passwords are never stored in plain text and are handled securely.
        </p>
      </div>
    </div>
  );
}
