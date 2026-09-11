/**
 * Hash an IP address for privacy-preserving storage.
 * Uses SHA-256 with a server-side salt (Node crypto).
 * Returns 64-char hex truncated to 32 for storage.
 */
export function hashIp(ip: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createHash } = require("node:crypto");
    const salt = process.env.IP_HASH_SALT || "dph-default-salt";
    return createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
  } catch {
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
