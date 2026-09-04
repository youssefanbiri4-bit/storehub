import { createAdminClient } from "@/lib/supabase/admin";
import { hashIp } from "./create-signed-download";

interface RecordDownloadInput {
  productId: string;
  fileId: string;
  entitlementId?: string;
  userId?: string;
  customerEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record a download event in the database.
 * Uses the admin client to insert (bypasses RLS).
 */
export async function recordDownloadEvent(input: RecordDownloadInput): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("download_events").insert({
    product_id: input.productId,
    file_id: input.fileId,
    entitlement_id: input.entitlementId || null,
    user_id: input.userId || null,
    customer_email: input.customerEmail || null,
    ip_hash: input.ipAddress ? hashIp(input.ipAddress) : null,
    user_agent: input.userAgent || null,
  });

  if (error) {
    console.error("Failed to record download event:", error.message);
  }
}

/**
 * Atomically increment the download_count on an entitlement.
 * Returns the updated entitlement or null on failure.
 */
export async function incrementEntitlementDownloadCount(
  entitlementId: string
): Promise<{ download_count: number; max_downloads: number | null } | null> {
  const admin = createAdminClient();

  // Use RPC for atomic increment, or fall back to select+update
  const { data, error } = await admin
    .from("download_entitlements")
    .select("download_count, max_downloads")
    .eq("id", entitlementId)
    .single();

  if (error || !data) return null;

  // Check limit before incrementing
  if (data.max_downloads !== null && data.download_count >= data.max_downloads) {
    return { download_count: data.download_count, max_downloads: data.max_downloads };
  }

  const { error: updateError } = await admin
    .from("download_entitlements")
    .update({ download_count: data.download_count + 1 })
    .eq("id", entitlementId)
    .eq("download_count", data.download_count); // Optimistic lock

  if (updateError) return null;

  return {
    download_count: data.download_count + 1,
    max_downloads: data.max_downloads,
  };
}
