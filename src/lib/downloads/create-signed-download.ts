import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

interface SignedDownloadResult {
  signedUrl: string;
  expiresAt: Date;
}

/**
 * Generate a short-lived signed URL for a private storage object.
 * Uses the admin/service-role client to bypass RLS for storage access.
 */
export async function createSignedDownloadUrl(
  storagePath: string,
  expiresInMinutes: number = 5
): Promise<SignedDownloadResult> {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const { data, error } = await admin.storage
    .from("product-files")
    .createSignedUrl(storagePath, expiresInMinutes * 60);

  if (error || !data?.signedUrl) {
    throw new Error("Failed to generate download link");
  }

  return { signedUrl: data.signedUrl, expiresAt };
}

/**
 * Hash an IP address for privacy-preserving storage.
 * Uses SHA-256 with a server-side salt (Node crypto).
 * Returns 64-char hex truncated to 32 for storage.
 */
export function hashIp(ip: string): string {
  // Use Node crypto for server-side deterministic hashing
  // Fallback to simple hash only if crypto unavailable (edge runtime)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createHash } = require("node:crypto");
    const salt = process.env.IP_HASH_SALT || "dph-default-salt";
    return createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
  } catch {
    // Fallback: not secure, but prevents crash in edge
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + (process.env.IP_HASH_SALT || "dph-default-salt"));
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(36);
  }
}
