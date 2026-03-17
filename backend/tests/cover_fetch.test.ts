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

// ── Allowed domains (network tests) ─────────────────────────────────────────

Deno.test({ name: 'cover-fetch accepts coverartarchive.org domain', sanitizeResources: false, fn: async () => {
  // Will likely return 502 since the URL doesn't exist, but should NOT be 403
  const { status } = await postFetch({ url: 'https://coverartarchive.org/release/test/front.jpg' });
  assertEquals(status !== 403, true);
}});

Deno.test({ name: 'cover-fetch accepts archive.org subdomain', sanitizeResources: false, fn: async () => {
  const { status } = await postFetch({ url: 'https://ia601234.us.archive.org/image.jpg' });
  assertEquals(status !== 403, true);
}});

// ── Response shape (network test) ────────────────────────────────────────────

Deno.test({ name: 'cover-fetch response has cover field', sanitizeResources: false, fn: async () => {
  const { body } = await postFetch({ url: 'https://coverartarchive.org/release/nonexistent/front.jpg' });
  assertExists(body);
  assertExists(body.status);
  assertExists(body.message);
  assertEquals('cover' in body, true);
}});
