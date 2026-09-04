import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export interface AuthUser {
  id: string;
  email: string;
  role: "customer" | "admin";
}

/**
 * Get the current authenticated user with their role.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check role from user_roles table
  const admin = createAdminClient();
  const { data: roleData } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email || "",
    role: roleData?.role === "admin" ? "admin" : "customer",
  };
}

/**
 * Require an authenticated admin user. Throws if not admin.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  if (user.role !== "admin") {
    // Fallback: check email-based admin (legacy)
    if (ADMIN_EMAIL && user.email === ADMIN_EMAIL) {
      return user;
    }
    throw new Error("Admin access required");
  }

  return user;
}

/**
 * Assert admin access. Throws if not admin.
 */
export async function assertAdmin(): Promise<void> {
  await requireAdmin();
}
