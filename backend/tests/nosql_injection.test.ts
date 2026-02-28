import { assertEquals } from '@std/assert';
import { Router } from '@oak/oak';
import getSettingsModule from '../Routes/v1/API/GetSettings.ts';
import getContribsModule from '../Routes/v1/API/GetRecentContributions.ts';
import { testRequest } from './test_helpers.ts';

/**
 * Wrap a route module's router with middleware that injects a mock DBHandler
 * onto ctx.state.Mongo. The mock records the filter it receives so tests can
 * assert that operator objects never reach the DB layer.
 */
function withMockMongo(routeModule: { router: Router }): { router: Router; calls: { collection: string; filter: object }[] } {
  const calls: { collection: string; filter: object }[] = [];

  const wrapper = new Router();
  wrapper.use(async (ctx, next) => {
    ctx.state.Mongo = {
      selectOneByFilter(collection: string, filter: object) {
        calls.push({ collection, filter });
        return Promise.resolve(null);
      }
    };
    await next();
  });
  wrapper.use(routeModule.router.routes());
  wrapper.use(routeModule.router.allowedMethods());

  return { router: wrapper, calls };
}

/** POST JSON helper */
function postJson(router: Router, path: string, body: unknown) {
  return testRequest(router, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── GetSettings ──────────────────────────────────────────────────────────────

Deno.test('GetSettings rejects object body (NoSQL operator)', async () => {
  const { router, calls } = withMockMongo(getSettingsModule);
  const { status } = await postJson(router, '/GetSettings', { "$ne": null });

  assertEquals(status, 400);
  assertEquals(calls.length, 0, 'DB should not be queried');
});

Deno.test('GetSettings rejects numeric body', async () => {
  const { router, calls } = withMockMongo(getSettingsModule);
  const { status } = await postJson(router, '/GetSettings', 12345);

  assertEquals(status, 400);
  assertEquals(calls.length, 0);
});

Deno.test('GetSettings rejects null body', async () => {
  const { router, calls } = withMockMongo(getSettingsModule);
  const { status } = await postJson(router, '/GetSettings', null);

  assertEquals(status, 400);
  assertEquals(calls.length, 0);
});

Deno.test('GetSettings accepts a plain string uid', async () => {
  const { router, calls } = withMockMongo(getSettingsModule);
  const { status } = await postJson(router, '/GetSettings', "user-abc-123");

  assertEquals(status, 200);
  assertEquals(calls.length, 1);
  assertEquals(calls[0].filter, { jfId: "user-abc-123" });
});

// ── GetRecentContributions ───────────────────────────────────────────────────

Deno.test('GetRecentContributions rejects uid with NoSQL operator', async () => {
  const { router, calls } = withMockMongo(getContribsModule);
  const { status } = await postJson(router, '/GetRecentContributions', { uid: { "$ne": null } });

  assertEquals(status, 400);
  assertEquals(calls.length, 0, 'DB should not be queried');
});

Deno.test('GetRecentContributions rejects missing uid', async () => {
  const { router, calls } = withMockMongo(getContribsModule);
  const { status } = await postJson(router, '/GetRecentContributions', { foo: "bar" });

  assertEquals(status, 400);
  assertEquals(calls.length, 0);
});

Deno.test('GetRecentContributions rejects numeric uid', async () => {
  const { router, calls } = withMockMongo(getContribsModule);
  const { status } = await postJson(router, '/GetRecentContributions', { uid: 99999 });

  assertEquals(status, 400);
  assertEquals(calls.length, 0);
});

Deno.test('GetRecentContributions accepts a plain string uid', async () => {
  const { router, calls } = withMockMongo(getContribsModule);
  const { status } = await postJson(router, '/GetRecentContributions', { uid: "user-abc-123" });

  assertEquals(status, 200);
  assertEquals(calls.length, 1);
  assertEquals(calls[0].filter, { jfId: "user-abc-123" });
});

// ── GetRecentContributions: returns DB data, not request echo ────────────────

Deno.test('GetRecentContributions returns data from DB, not from request body', async () => {
  const dbContributions = [{ title: 'Song A', date: '2026-01-01' }];

  // Build a mock that returns a real document
  const wrapper = new Router();
  wrapper.use(async (ctx, next) => {
    ctx.state.Mongo = {
      selectOneByFilter(_collection: string, _filter: object) {
        return Promise.resolve({ jfId: 'user-abc-123', contributions: dbContributions });
      }
    };
    await next();
  });
  wrapper.use(getContribsModule.router.routes());
  wrapper.use(getContribsModule.router.allowedMethods());

  // Send a request with a DIFFERENT contributions array to prove it's not echoed
  const { status, body } = await postJson(wrapper, '/GetRecentContributions', {
    uid: 'user-abc-123',
    contributions: [{ title: 'INJECTED', date: 'never' }],
  });

  assertEquals(status, 200);
  assertEquals((body?.data as Record<string, unknown>)?.contributions, dbContributions);
});

// ── GetRecentContributions: missing return regression ────────────────────────

Deno.test('GetRecentContributions returns 400 body and does not fall through', async () => {
  const { router, calls } = withMockMongo(getContribsModule);
  const { status, body } = await postJson(router, '/GetRecentContributions', {});

  assertEquals(status, 400);
  assertEquals(body?.message, 'Bad Request');
  assertEquals(calls.length, 0, 'DB must not be queried on invalid input');
});
