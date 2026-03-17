import { assertEquals, assertExists } from '@std/assert';
import { Router } from '@oak/oak';
import coverSearchModule from '../Routes/v1/Jellyfin/coverSearch.ts';
import { testRequest } from './test_helpers.ts';

function makeRouter(): Router {
  const wrapper = new Router();
  wrapper.use(coverSearchModule.router.routes());
  wrapper.use(coverSearchModule.router.allowedMethods());
  return wrapper;
}

// ── Parameter validation ─────────────────────────────────────────────────────

Deno.test('cover-search returns 400 when artist is missing', async () => {
  const { status, body } = await testRequest(makeRouter(), '/cover-search?album=Test');
  assertEquals(status, 400);
  assertEquals(body?.message, 'Missing artist or album parameter');
});

Deno.test('cover-search returns 400 when album is missing', async () => {
  const { status, body } = await testRequest(makeRouter(), '/cover-search?artist=Test');
  assertEquals(status, 400);
  assertEquals(body?.message, 'Missing artist or album parameter');
});

Deno.test('cover-search returns 400 when both params are missing', async () => {
  const { status, body } = await testRequest(makeRouter(), '/cover-search');
  assertEquals(status, 400);
  assertExists(body?.message);
});

// ── Response shape (network test) ────────────────────────────────────────────

Deno.test({ name: 'cover-search returns 200 with results array when params provided', sanitizeResources: false, fn: async () => {
  const { status, body } = await testRequest(
    makeRouter(),
    '/cover-search?artist=test&album=test'
  );
  assertEquals(status, 200);
  assertExists(body?.results);
  assertEquals(Array.isArray(body?.results), true);
}});
