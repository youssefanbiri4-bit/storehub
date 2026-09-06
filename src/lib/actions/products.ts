"use server";

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { buildProductWritePayload } from "@/lib/product-payload";
import type { ProductStatus } from "@/types";
import { logDatabaseError } from "@/lib/errors/database-error";

export async function createProductAction(formData: Record<string, unknown>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const { payload, errors } = buildProductWritePayload(formData);
  if (errors) {
    return { success: false, error: errors[0] };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("products").insert(payload).select("id").single();

  if (error) {
    logDatabaseError("createProductAction", error);
    return { success: false, error: error.message || "Failed to create product" };
  }
  if (!data?.id) {
    return { success: false, error: "Failed to create product - no id returned" };
  }
  return { success: true, id: data.id };
}

export async function updateProductAction(productId: string, formData: Record<string, unknown>, opts?: { expectedUpdatedAt?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const { payload, errors } = buildProductWritePayload(formData, opts as unknown as { statusOverride?: ProductStatus });
  // Handle status override separately if passed via formData? For now handle via opts
  // Actually caller may pass status in formData via is_published; we handle.

  if (errors) {
    return { success: false, error: errors[0] };
  }

  const admin = createAdminClient();

  // Optional optimistic concurrency: if expectedUpdatedAt provided, ensure no concurrent update lost
  // We use updated_at check to prevent autosave vs manual conflict
  let query = admin.from("products").update(payload).eq("id", productId);
  if (opts?.expectedUpdatedAt) {
    query = query.eq("updated_at", opts.expectedUpdatedAt) as never;
  }

  const { data, error } = await query.select("id, updated_at").single();

  if (error) {
    // Check for 0 rows due to updated_at mismatch (PGRST116 or no rows)
    if (error.code === "PGRST116" || error.message.includes("0 rows")) {
      return { success: false, error: "Conflict: product was modified by another save. Please reload." };
    }
    logDatabaseError("updateProductAction", error);
    return { success: false, error: error.message || "Failed to update product" };
  }
  if (!data) {
    return { success: false, error: "Update failed - no rows affected" };
  }

  return { success: true };
}

// Autosave uses same validation and payload builder but is more lenient on required fields?
export async function autosaveProductAction(productId: string, formData: Record<string, unknown>, expectedUpdatedAt?: string): Promise<{ success: boolean; error?: string; updatedAt?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const { payload, errors } = buildProductWritePayload(formData);
  if (errors) {
    return { success: false, error: errors.join(", ") };
  }

  const admin = createAdminClient();
  let query = admin.from("products").update(payload).eq("id", productId);
  if (expectedUpdatedAt) {
    query = query.eq("updated_at", expectedUpdatedAt) as never;
  }
  const { data, error } = await query.select("updated_at").single();
  if (error) {
    if (error.code === "PGRST116" || error.message.includes("0 rows")) {
      return { success: false, error: "Conflict" };
    }
    logDatabaseError("autosaveProductAction", error);
    return { success: false, error: error.message };
  }
  return { success: true, updatedAt: (data as { updated_at: string })?.updated_at };
}
