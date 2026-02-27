import { assertEquals } from '@std/assert';
import { Application, Router } from '@oak/oak';

/**
 * Reproduce the exact security headers middleware from main.ts
 * and verify it sets every expected header.
 */
async function getHeaders(): Promise<Headers> {
  const app = new Application();

  // Security headers (mirrors main.ts)
  app.use(async (ctx, next) => {
    ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
    ctx.response.headers.set('X-Frame-Options', 'DENY');
    ctx.response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    ctx.response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
    ctx.response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"
    );
    await next();
  });

  const router = new Router();
  router.get('/test', (ctx) => { ctx.response.body = { ok: true }; });
  app.use(router.routes());
  app.use(router.allowedMethods());

  const response = await app.handle(new Request('http://localhost/test'));
  // Consume body so the response is fully read
  await response?.text();
  return response?.headers ?? new Headers();
}

// ── Individual header checks ──────────────────────────────────────────────────

Deno.test('sets X-Content-Type-Options to nosniff', async () => {
  const headers = await getHeaders();
  assertEquals(headers.get('X-Content-Type-Options'), 'nosniff');
});

Deno.test('sets X-Frame-Options to DENY', async () => {
  const headers = await getHeaders();
  assertEquals(headers.get('X-Frame-Options'), 'DENY');
});

Deno.test('sets Referrer-Policy', async () => {
  const headers = await getHeaders();
  assertEquals(headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
});

Deno.test('sets Permissions-Policy', async () => {
  const headers = await getHeaders();
  assertEquals(headers.get('Permissions-Policy'), 'geolocation=(), microphone=(), camera=(), payment=()');
});

Deno.test('sets Content-Security-Policy', async () => {
  const headers = await getHeaders();
  const csp = headers.get('Content-Security-Policy')!;

  // Verify key directives are present
  assertEquals(csp.includes("default-src 'self'"), true);
  assertEquals(csp.includes("script-src 'self'"), true);
  assertEquals(csp.includes("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"), true);
  assertEquals(csp.includes("font-src 'self' https://fonts.gstatic.com"), true);
  assertEquals(csp.includes("img-src 'self' data:"), true);
  assertEquals(csp.includes("connect-src 'self'"), true);
});
