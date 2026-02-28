import { Context } from '@oak/oak';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitRule {
  /** Max requests allowed within the window. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

/**
 * In-memory per-IP rate limiter.
 *
 * Usage:
 *   const limiter = new RateLimiter({ '/api/v1/jellyfin/authenticate': { max: 10, windowMs: 15 * 60_000 } });
 *   app.use(limiter.middleware());
 */
export class RateLimiter {
  /** Map key = "ip:path" */
  private buckets = new Map<string, RateLimitEntry>();
  private rules: Record<string, RateLimitRule>;

  constructor(rules: Record<string, RateLimitRule>) {
    this.rules = rules;
  }

  /** Oak middleware that enforces rate limits for configured paths. */
  middleware() {
    return async (ctx: Context, next: () => Promise<unknown>) => {
      const path = ctx.request.url.pathname;
      const rule = this.rules[path];

      // No rule for this path — pass through
      if (!rule) {
        await next();
        return;
      }

      const ip = ctx.request.ip ?? 'unknown';
      const key = `${ip}:${path}`;
      const now = Date.now();

      let entry = this.buckets.get(key);

      // Reset if window expired
      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + rule.windowMs };
        this.buckets.set(key, entry);
      }

      entry.count++;

      // Set informational headers
      const remaining = Math.max(0, rule.max - entry.count);
      ctx.response.headers.set('X-RateLimit-Limit', String(rule.max));
      ctx.response.headers.set('X-RateLimit-Remaining', String(remaining));
      ctx.response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

      if (entry.count > rule.max) {
        ctx.response.status = 429;
        ctx.response.body = { message: 'Too many requests. Try again later.' };
        return;
      }

      await next();
    };
  }

  /** Purge expired entries (call periodically to prevent unbounded growth). */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.buckets) {
      if (now > entry.resetAt) {
        this.buckets.delete(key);
      }
    }
  }

  /** Visible for testing. */
  getBucketCount(): number {
    return this.buckets.size;
  }

  /**
   * Start a periodic cleanup timer that purges expired buckets.
   * @param intervalMs How often to run cleanup (default 5 minutes).
   * @returns The timer ID (for clearing in tests or shutdown).
   */
  startCleanupScheduler(intervalMs = 5 * 60_000): number {
    return setInterval(() => this.cleanup(), intervalMs);
  }

  /** Reset all buckets (for testing). */
  reset(): void {
    this.buckets.clear();
  }
}
