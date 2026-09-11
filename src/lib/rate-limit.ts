/**
 * Rate limiter interface - pluggable for single-instance (memory) vs distributed (Redis).
 * Default is memory with TTL and bounded size.
 * Production uses Upstash Redis when UPSTASH_REDIS_REST_URL is configured.
 */

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterMs?: number } | Promise<{ allowed: boolean; retryAfterMs?: number }>;
}

// ============================================
// Memory Rate Limiter (dev/fallback)
// ============================================

type Entry = { count: number; resetAt: number };

class MemoryRateLimiter implements RateLimiter {
  private store = new Map<string, Entry>();
  private maxKeys = 5000;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
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

// ============================================
// Upstash Redis Rate Limiter (production)
// ============================================

class UpstashRedisRateLimiter implements RateLimiter {
  async check(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    try {
      // Upstash Ratelimit uses fixed window with seconds
      const windowSec = Math.ceil(windowMs / 1000);

      // Create a per-key limiter with the correct window
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSec}s`),
        analytics: false,
        prefix: `storehub:${key}`,
      });

      const result = await limiter.limit(key);

      if (!result.success) {
        const retryAfterMs = result.reset - Date.now();
        return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
      }

      return { allowed: true };
    } catch {
      // Fail-open: if Redis is unavailable, allow the request
      return { allowed: true };
    }
  }
}

// ============================================
// Singleton instances and factory
// ============================================

const memoryLimiter = new MemoryRateLimiter();
const upstashLimiter = new UpstashRedisRateLimiter();

function isProductionConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Get the appropriate rate limiter for the current environment.
 * - Production with Upstash: distributed Redis limiter
 * - Development / fallback: in-memory limiter
 */
export function getRateLimiter(): RateLimiter {
  if (isProductionConfigured()) {
    return upstashLimiter;
  }
  return memoryLimiter;
}

// Export memory limiter for direct use in tests/dev
export const memoryRateLimiter = memoryLimiter;

// ============================================
// IP and key helpers
// ============================================

// Helper to get client IP securely - trust only first X-Forwarded-For if behind trusted proxy
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
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
