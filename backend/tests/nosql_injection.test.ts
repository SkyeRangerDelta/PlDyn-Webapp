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
function withMockMongo(
  routeModule: { router: Router },
  opts?: { userId?: string; dbResult?: unknown }
): { router: Router; calls: { collection: string; filter: object }[] } {
  const calls: { collection: string; filter: object }[] = [];

  const wrapper = new Router();
  wrapper.use(async (ctx, next) => {
    ctx.state.Mongo = {
      selectOneByFilter(collection: string, filter: object) {
        calls.push({ collection, filter });
        return Promise.resolve(opts?.dbResult ?? null);
      }
    };
    if (opts?.userId !== undefined) {
      ctx.state.userId = opts.userId;
    }
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
// The endpoint now reads userId from ctx.state (set by auth middleware),
// NOT from the request body.

Deno.test('GetRecentContributions returns 401 when no userId in state', async () => {
  const { router, calls } = withMockMongo(getContribsModule);
  const { status, body } = await postJson(router, '/GetRecentContributions', {});

  assertEquals(status, 401);
  assertEquals(body?.message, 'Unauthorized');
  assertEquals(calls.length, 0, 'DB must not be queried without auth');
});

Deno.test('GetRecentContributions returns contributions when userId is in state', async () => {
  const dbContributions = [
    { album: 'Album A', albumArtist: 'Artist A', year: 2026, songCount: 3, coverUrl: null, date: '2026-01-01' },
  ];
  const { router, calls } = withMockMongo(getContribsModule, {
    userId: 'user-abc-123',
    dbResult: { jfId: 'user-abc-123', contributions: dbContributions },
  });

  const { status, body } = await postJson(router, '/GetRecentContributions', {});

  assertEquals(status, 200);
  assertEquals(calls.length, 1);
  assertEquals(calls[0].filter, { jfId: 'user-abc-123' });
  const data = body?.data as Record<string, unknown>;
  assertEquals(data?.contributions, dbContributions);
  assertEquals(data?.totalAlbums, 1);
  assertEquals(data?.totalSongs, 3);
});

Deno.test('GetRecentContributions returns empty array when no DB record', async () => {
  const { router, calls } = withMockMongo(getContribsModule, {
    userId: 'user-no-data',
  });

  const { status, body } = await postJson(router, '/GetRecentContributions', {});

  assertEquals(status, 200);
  assertEquals(calls.length, 1);
  const data = body?.data as Record<string, unknown>;
  assertEquals(data?.contributions, []);
  assertEquals(data?.totalAlbums, 0);
  assertEquals(data?.totalSongs, 0);
});

Deno.test('GetRecentContributions ignores uid in request body (uses state only)', async () => {
  const { router, calls } = withMockMongo(getContribsModule, {
    userId: 'real-user',
    dbResult: { jfId: 'real-user', contributions: [] },
  });

  // Even though body has a different uid, the route should use ctx.state.userId
  const { status } = await postJson(router, '/GetRecentContributions', { uid: 'other-user' });

  assertEquals(status, 200);
  assertEquals(calls.length, 1);
  assertEquals(calls[0].filter, { jfId: 'real-user' });
});
