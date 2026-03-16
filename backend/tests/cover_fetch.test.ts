import { assertEquals, assertExists } from '@std/assert';
import { Router } from '@oak/oak';
import coverFetchModule from '../Routes/v1/Jellyfin/coverFetch.ts';
import { testRequest } from './test_helpers.ts';

function makeRouter(): Router {
  const wrapper = new Router();
  wrapper.use(coverFetchModule.router.routes());
  wrapper.use(coverFetchModule.router.allowedMethods());
  return wrapper;
}

function postFetch(body: Record<string, unknown>) {
  return testRequest(makeRouter(), '/cover-fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Parameter validation ─────────────────────────────────────────────────────

Deno.test('cover-fetch returns 400 when url is missing', async () => {
  const { status, body } = await postFetch({});
  assertEquals(status, 400);
  assertEquals(body?.message, 'Missing url parameter');
});

Deno.test('cover-fetch returns 400 for non-string url', async () => {
  const { status, body } = await postFetch({ url: 12345 });
  assertEquals(status, 400);
  assertEquals(body?.message, 'Missing url parameter');
});

// ── Domain allowlist ─────────────────────────────────────────────────────────

Deno.test('cover-fetch rejects disallowed domain', async () => {
  const { status, body } = await postFetch({ url: 'https://evil.example.com/image.jpg' });
  assertEquals(status, 403);
  assertEquals(body?.message, 'Domain not allowed');
});

Deno.test('cover-fetch rejects localhost', async () => {
  const { status, body } = await postFetch({ url: 'http://localhost:8080/image.jpg' });
  assertEquals(status, 403);
  assertEquals(body?.message, 'Domain not allowed');
});

// ── Allowed domains ──────────────────────────────────────────────────────────

Deno.test('cover-fetch accepts coverartarchive.org domain', async () => {
  // This will likely return a 502 since the URL doesn't exist, but it should NOT be 403
  const { status } = await postFetch({ url: 'https://coverartarchive.org/release/test/front.jpg' });
  // Should be 200 or 502, but NOT 403
  assertEquals(status !== 403, true);
});

Deno.test('cover-fetch accepts archive.org subdomain', async () => {
  const { status } = await postFetch({ url: 'https://ia601234.us.archive.org/image.jpg' });
  assertEquals(status !== 403, true);
});

// ── Response shape ───────────────────────────────────────────────────────────

Deno.test('cover-fetch response has cover field', async () => {
  const { body } = await postFetch({ url: 'https://coverartarchive.org/release/nonexistent/front.jpg' });
  assertExists(body);
  // Should have status, message, cover fields
  assertExists(body.status);
  assertExists(body.message);
  assertEquals('cover' in body, true);
});
