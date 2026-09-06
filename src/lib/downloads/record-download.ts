import "server-only";
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
 * Atomically increment the download_count on an entitlement via RPC.
 * Returns the updated counts or null on failure.
 * Uses SELECT FOR UPDATE inside a SECURITY DEFINER function to avoid race.
 * @deprecated Use consumeDownloadAtomically for paid downloads (checks ownership, payment, file, limit)
 */
export async function incrementEntitlementDownloadCount(
  entitlementId: string
): Promise<{ download_count: number; max_downloads: number | null } | null> {
  const admin = createAdminClient();

  // Try atomic RPC first (requires migration 006). RPC returns empty when limit/revoked/expired.
  const { data: rpcData, error: rpcError } = await admin.rpc(
    "increment_entitlement_download_count" as never,
    { p_entitlement_id: entitlementId } as never
  );

  if (!rpcError) {
    if (rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      const row = rpcData[0] as { download_count: number; max_downloads: number | null };
      if (row && typeof row.download_count === "number") {
        return {
          download_count: row.download_count,
          max_downloads: row.max_downloads,
        };
      }
    } else if (rpcData && !Array.isArray(rpcData) && typeof (rpcData as { download_count?: number }).download_count === "number") {
      const row = rpcData as { download_count: number; max_downloads: number | null };
      return {
        download_count: row.download_count,
        max_downloads: row.max_downloads,
      };
    } else if (Array.isArray(rpcData) && rpcData.length === 0) {
      // Empty set means limit/revoked/expired reached atomically
      return null;
    }
  }

  // Fallback: optimistic lock with conditional update (detect 0 rows)
  const { data, error } = await admin
    .from("download_entitlements")
    .select("download_count, max_downloads")
    .eq("id", entitlementId)
    .single();

  if (error || !data) return null;

  if (data.max_downloads !== null && data.download_count >= data.max_downloads) {
    return { download_count: data.download_count, max_downloads: data.max_downloads };
  }

  const { data: updated, error: updateError } = await admin
    .from("download_entitlements")
    .update({ download_count: data.download_count + 1 })
    .eq("id", entitlementId)
    .eq("download_count", data.download_count) // Optimistic lock
    .select("download_count, max_downloads")
    .single();

  if (updateError || !updated) return null;

  // If no row returned, optimistic lock failed (concurrent update) -> treat as failure
  return {
    download_count: updated.download_count,
    max_downloads: updated.max_downloads,
  };
}

export type ConsumeResult =
  | { status: "ok"; download_count: number; max_downloads: number | null }
  | { status: "not_found" | "forbidden" | "revoked" | "expired" | "limit_exceeded" | "product_unavailable" | "file_unavailable" | "payment_pending" | "error"; download_count?: number; max_downloads?: number | null };

/**
 * Atomically check ownership, payment, file, limit and consume one download.
 * Uses consume_download_atomically RPC (migration 011) - single transaction.
 * Returns explicit status for UI.
 */
export async function consumeDownloadAtomically(
  entitlementId: string,
  fileId: string,
  userId: string
): Promise<ConsumeResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_download_atomically" as never, {
    p_entitlement_id: entitlementId,
    p_file_id: fileId,
    p_user_id: userId,
  } as never);

  if (error) {
    console.error("consume_download_atomically rpc error", error.message);
    return { status: "error" };
  }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { status: "error" };
  }
  const row = Array.isArray(data) ? (data[0] as { result: string; download_count: number; max_downloads: number | null }) : (data as unknown as { result: string; download_count: number; max_downloads: number | null });
  const status = row.result as ConsumeResult["status"];
  if (status === "ok") {
    return { status: "ok", download_count: row.download_count, max_downloads: row.max_downloads };
  }
  return { status, download_count: row.download_count, max_downloads: row.max_downloads };
}
