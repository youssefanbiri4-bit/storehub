import "server-only";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RoleMutationResult {
  success: boolean;
  error?: string;
}

/**
 * Assign a role to a user. Only callable by admins.
 * Enforces: no self-promotion, no last-admin deletion.
 * Uses the service-role client to call SECURITY DEFINER functions.
 */
export async function assignUserRole(
  targetUserId: string,
  targetRole: "customer" | "admin"
): Promise<RoleMutationResult> {
  // 1. Require admin authorization
  const admin = await requireAdmin();

  // 2. Additional server-side guard: prevent self-promotion
  if (targetUserId === admin.id && targetRole === "admin") {
    return { success: false, error: "Cannot promote yourself to admin" };
  }

  // 3. Call the SECURITY DEFINER function via service-role client
  const serviceClient = createAdminClient();
  const { error } = await serviceClient.rpc("admin_assign_role" as never, {
    target_user_id: targetUserId,
    target_role: targetRole,
  } as never);

  if (error) {
    return { success: false, error: error.message || "Failed to assign role" };
  }

  return { success: true };
}

/**
 * Remove a user's role. Only callable by admins.
 * Enforces: no removing the last admin.
 * Uses the service-role client to call SECURITY DEFINER functions.
 */
export async function removeUserRole(
  targetUserId: string
): Promise<RoleMutationResult> {
  // 1. Require admin authorization
  await requireAdmin();

  // 2. Call the SECURITY DEFINER function via service-role client
  const serviceClient = createAdminClient();
  const { error } = await serviceClient.rpc("admin_remove_role" as never, {
    target_user_id: targetUserId,
  } as never);

  if (error) {
    return { success: false, error: error.message || "Failed to remove role" };
  }

  return { success: true };
}
