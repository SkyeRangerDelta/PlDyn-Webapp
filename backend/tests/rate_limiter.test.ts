import { assertEquals } from '@std/assert';
import { Application, Router } from '@oak/oak';
import { RateLimiter } from '../Utilities/RateLimiter.ts';

/** Send a GET request through an Oak app with the rate limiter and a test route. */
async function makeRequest(
  limiter: RateLimiter,
  path: string
): Promise<{ status: number; headers: Headers; body: Record<string, unknown> | null }> {
  const app = new Application();
  app.use(limiter.middleware());

  const router = new Router();
  router.get('/limited', (ctx) => { ctx.response.body = { ok: true }; });
  router.get('/unlimited', (ctx) => { ctx.response.body = { ok: true }; });
  router.get('/api/v1/jellyfin/watch-ticket', (ctx) => { ctx.response.body = { ok: true }; });
  app.use(router.routes());
  app.use(router.allowedMethods());

  const response = await app.handle(new Request(`http://localhost${path}`));
  if (!response) return { status: 404, headers: new Headers(), body: null };

  let body = null;
  try { body = await response.json(); } catch { /* non-JSON */ }
  return { status: response.status, headers: response.headers, body };
}

// ── Passes through when under limit ───────────────────────────────────────────

Deno.test('allows requests under the rate limit', async () => {
  const limiter = new RateLimiter({ '/limited': { max: 5, windowMs: 60_000 } });

  const { status, body } = await makeRequest(limiter, '/limited');
  assertEquals(status, 200);
  assertEquals(body?.ok, true);
});

// ── Blocks after exceeding limit ──────────────────────────────────────────────

Deno.test('blocks requests after exceeding the rate limit', async () => {
  const limiter = new RateLimiter({ '/limited': { max: 3, windowMs: 60_000 } });

  // First 3 should pass
  for (let i = 0; i < 3; i++) {
    const { status } = await makeRequest(limiter, '/limited');
    assertEquals(status, 200);
  }

  // 4th should be blocked
  const { status, body } = await makeRequest(limiter, '/limited');
  assertEquals(status, 429);
  assertEquals(body?.message, 'Too many requests. Try again later.');
});

// ── Unconfigured paths are not limited ────────────────────────────────────────

Deno.test('does not limit paths without a rule', async () => {
  const limiter = new RateLimiter({ '/limited': { max: 1, windowMs: 60_000 } });

  // Exhaust the limited path
  await makeRequest(limiter, '/limited');
  const { status: blocked } = await makeRequest(limiter, '/limited');
  assertEquals(blocked, 429);

  // Unlimited path should still work
  const { status } = await makeRequest(limiter, '/unlimited');
  assertEquals(status, 200);
});

// ── Sets rate limit headers ───────────────────────────────────────────────────

Deno.test('sets X-RateLimit-* headers on limited paths', async () => {
  const limiter = new RateLimiter({ '/limited': { max: 5, windowMs: 60_000 } });

  const { headers } = await makeRequest(limiter, '/limited');
  assertEquals(headers.get('X-RateLimit-Limit'), '5');
  assertEquals(headers.get('X-RateLimit-Remaining'), '4');
  assertEquals(headers.has('X-RateLimit-Reset'), true);
});

// ── Window resets after expiry ────────────────────────────────────────────────

Deno.test('resets counter after the window expires', async () => {
  // Use a very short window (1ms) so it expires between requests
  const limiter = new RateLimiter({ '/limited': { max: 1, windowMs: 1 } });

  const { status: first } = await makeRequest(limiter, '/limited');
  assertEquals(first, 200);

  // Wait for window to expire
  await new Promise(r => setTimeout(r, 10));

  const { status: second } = await makeRequest(limiter, '/limited');
  assertEquals(second, 200);
});

// ── Cleanup purges expired entries ────────────────────────────────────────────

Deno.test('cleanup removes expired buckets', async () => {
  const limiter = new RateLimiter({ '/limited': { max: 10, windowMs: 1 } });

  await makeRequest(limiter, '/limited');
  assertEquals(limiter.getBucketCount(), 1);

  // Wait for window to expire, then clean
  await new Promise(r => setTimeout(r, 10));
  limiter.cleanup();
  assertEquals(limiter.getBucketCount(), 0);
});

// ── Scheduled cleanup fires automatically ────────────────────────────────────

Deno.test('startCleanupScheduler purges expired buckets automatically', async () => {
  const limiter = new RateLimiter({ '/limited': { max: 10, windowMs: 1 } });

  await makeRequest(limiter, '/limited');
  assertEquals(limiter.getBucketCount(), 1);

  // Start scheduler with a very short interval
  const timerId = limiter.startCleanupScheduler(15);

  // Wait for the window to expire and the scheduler to fire
  await new Promise(r => setTimeout(r, 50));

  assertEquals(limiter.getBucketCount(), 0);
  clearInterval(timerId);
});

// ── watch-ticket path is rate limited ────────────────────────────────────────

Deno.test('watch-ticket path is rate limited', async () => {
  const limiter = new RateLimiter({
    '/api/v1/jellyfin/watch-ticket': { max: 3, windowMs: 60_000 },
  });

  // First 3 should pass
  for (let i = 0; i < 3; i++) {
    const { status } = await makeRequest(limiter, '/api/v1/jellyfin/watch-ticket');
    assertEquals(status, 200);
  }

  // 4th should be blocked
  const { status } = await makeRequest(limiter, '/api/v1/jellyfin/watch-ticket');
  assertEquals(status, 429);
});
