import { assertEquals } from '@std/assert';
import { Application, Router } from '@oak/oak';

/**
 * Build a test app with the CORS middleware from main.ts.
 * Accepts an allowedOrigins list to simulate CORS_ORIGINS env config.
 */
function createApp(allowedOrigins: string[] = []) {
  const app = new Application();

  // CORS middleware (mirrors main.ts)
  app.use(async (ctx, next) => {
    const origin = ctx.request.headers.get('Origin');

    if (origin && allowedOrigins.includes(origin)) {
      ctx.response.headers.set('Access-Control-Allow-Origin', origin);
      ctx.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      ctx.response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      ctx.response.headers.set('Access-Control-Max-Age', '86400');
    }

    if (ctx.request.method === 'OPTIONS') {
      ctx.response.status = 204;
      return;
    }

    await next();
  });

  const router = new Router();
  router.get('/test', (ctx) => { ctx.response.body = { ok: true }; });
  router.post('/test', (ctx) => { ctx.response.body = { ok: true }; });
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}

// ── No allowed origins (default) ─────────────────────────────────────────────

Deno.test('same-origin request (no Origin header) passes through', async () => {
  const app = createApp();
  const res = await app.handle(new Request('http://localhost/test'));
  assertEquals(res?.status, 200);
  assertEquals(res?.headers.has('Access-Control-Allow-Origin'), false);
  await res?.text();
});

Deno.test('cross-origin request gets no CORS headers when no origins configured', async () => {
  const app = createApp();
  const res = await app.handle(new Request('http://localhost/test', {
    headers: { 'Origin': 'http://evil.com' }
  }));
  assertEquals(res?.status, 200);
  assertEquals(res?.headers.has('Access-Control-Allow-Origin'), false);
  await res?.text();
});

Deno.test('OPTIONS preflight returns 204 even for disallowed origins', async () => {
  const app = createApp();
  const res = await app.handle(new Request('http://localhost/test', {
    method: 'OPTIONS',
    headers: { 'Origin': 'http://evil.com' }
  }));
  assertEquals(res?.status, 204);
  assertEquals(res?.headers.has('Access-Control-Allow-Origin'), false);
  await res?.text();
});

// ── With allowed origins ─────────────────────────────────────────────────────

Deno.test('allowed origin gets CORS headers', async () => {
  const app = createApp(['http://trusted.com']);
  const res = await app.handle(new Request('http://localhost/test', {
    headers: { 'Origin': 'http://trusted.com' }
  }));
  assertEquals(res?.status, 200);
  assertEquals(res?.headers.get('Access-Control-Allow-Origin'), 'http://trusted.com');
  assertEquals(res?.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assertEquals(res?.headers.get('Access-Control-Allow-Headers'), 'Authorization, Content-Type');
  assertEquals(res?.headers.get('Access-Control-Max-Age'), '86400');
  await res?.text();
});

Deno.test('non-allowed origin is rejected even when allowlist is set', async () => {
  const app = createApp(['http://trusted.com']);
  const res = await app.handle(new Request('http://localhost/test', {
    headers: { 'Origin': 'http://evil.com' }
  }));
  assertEquals(res?.status, 200);
  assertEquals(res?.headers.has('Access-Control-Allow-Origin'), false);
  await res?.text();
});

Deno.test('OPTIONS preflight for allowed origin returns 204 with CORS headers', async () => {
  const app = createApp(['http://trusted.com']);
  const res = await app.handle(new Request('http://localhost/test', {
    method: 'OPTIONS',
    headers: { 'Origin': 'http://trusted.com' }
  }));
  assertEquals(res?.status, 204);
  assertEquals(res?.headers.get('Access-Control-Allow-Origin'), 'http://trusted.com');
  await res?.text();
});
