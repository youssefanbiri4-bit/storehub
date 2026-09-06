/**
 * Rate limiter interface - pluggable for single-instance (memory) vs distributed (Redis)
 * Default is memory with TTL and bounded size.
 */

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterMs?: number };
}

type Entry = { count: number; resetAt: number };

class MemoryRateLimiter implements RateLimiter {
  private store = new Map<string, Entry>();
  private maxKeys = 5000;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Periodic cleanup to bound memory
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
      if (this.cleanupInterval && typeof (this.cleanupInterval as unknown as { unref?: () => void }).unref === "function") {
        (this.cleanupInterval as unknown as { unref: () => void }).unref!();
      }
    }
  }

  check(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      if (this.store.size >= this.maxKeys) this.cleanup();
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true };
    }
    if (entry.count >= limit) {
      return { allowed: false, retryAfterMs: entry.resetAt - now };
    }
    entry.count++;
    return { allowed: true };
  }

  private cleanup() {
    const now = Date.now();
    for (const [k, v] of this.store.entries()) {
      if (now > v.resetAt) this.store.delete(k);
    }
    // If still too large, evict oldest
    if (this.store.size > this.maxKeys) {
      const toDelete = this.store.size - this.maxKeys;
      let i = 0;
      for (const k of this.store.keys()) {
        if (i++ >= toDelete) break;
        this.store.delete(k);
      }
    }
  }
}

export const memoryRateLimiter = new MemoryRateLimiter();

// Helper to get client IP securely - trust only first X-Forwarded-For if behind trusted proxy
// For single instance without trusted proxy list, we use first entry but document limitation
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // X-Forwarded-For may contain multiple IPs: client, proxy1, proxy2
    // Without trusted proxy list, we take first as client but note it can be spoofed if not behind proxy
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

// Helper to get rate limit key: prefer userId if authenticated, else IP
export function getRateLimitKey(request: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  return `ip:${getClientIp(request)}`;
}
