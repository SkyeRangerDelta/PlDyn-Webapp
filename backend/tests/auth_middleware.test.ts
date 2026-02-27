import { assertEquals } from '@std/assert';
import { Router } from '@oak/oak';
import { authMiddleware } from '../Routes/MainRouter.ts';
import { createTestJwt, testRequest, TEST_SECRET } from './test_helpers.ts';

// Build a minimal router with the real auth middleware and test endpoints.
function makeTestRouter(): Router {
  const router = new Router();
  router.use(authMiddleware);

  router.get('/api/v1/test', (ctx) => {
    ctx.response.body = { ok: true, userId: ctx.state.userId ?? null };
  });

  router.get('/api/v1/status', (ctx) => {
    ctx.response.body = { ok: true };
  });

  return router;
}

// ── Valid token (cookie) ─────────────────────────────────────────────────────

Deno.test('auth middleware allows a valid token via cookie', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const token = await createTestJwt();

  const { status, body } = await testRequest(makeTestRouter(), '/api/v1/test', {
    token,
  });

  assertEquals(status, 200);
  assertEquals(body?.ok, true);
});

// ── Valid token (Authorization header fallback) ──────────────────────────────

Deno.test('auth middleware allows a valid token via Authorization header', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const token = await createTestJwt();

  const { status, body } = await testRequest(makeTestRouter(), '/api/v1/test', {
    headers: { Authorization: `Bearer ${token}` },
  });

  assertEquals(status, 200);
  assertEquals(body?.ok, true);
});

// ── No token ──────────────────────────────────────────────────────────────────

Deno.test('auth middleware rejects request with no token', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);

  const { status, body } = await testRequest(makeTestRouter(), '/api/v1/test');

  assertEquals(status, 401);
  assertEquals(body?.message, 'Unauthorized (no token)');
});

// ── Forged token (wrong secret) ───────────────────────────────────────────────

Deno.test('auth middleware rejects a token signed with the wrong secret', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const forgedToken = await createTestJwt({ secret: 'wrong-secret' });

  const { status, body } = await testRequest(makeTestRouter(), '/api/v1/test', {
    token: forgedToken,
  });

  assertEquals(status, 401);
  assertEquals(body?.message, 'Invalid token.');
});

// ── Expired token ─────────────────────────────────────────────────────────────

Deno.test('auth middleware rejects an expired token', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const expiredToken = await createTestJwt({ expiresIn: '-1h' });

  const { status } = await testRequest(makeTestRouter(), '/api/v1/test', {
    token: expiredToken,
  });

  assertEquals(status, 401);
});

// ── Excluded route passes without token ───────────────────────────────────────

Deno.test('auth middleware skips excluded routes', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);

  const { status, body } = await testRequest(makeTestRouter(), '/api/v1/status');

  assertEquals(status, 200);
  assertEquals(body?.ok, true);
});

// ── userId is populated from JWT ID claim ────────────────────────────────────

Deno.test('auth middleware sets ctx.state.userId from JWT ID claim', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const token = await createTestJwt({ claims: { ID: 'jf-user-99' } });

  const { status, body } = await testRequest(makeTestRouter(), '/api/v1/test', {
    token,
  });

  assertEquals(status, 200);
  assertEquals(body?.userId, 'jf-user-99');
});

// ── Missing JWT_SECRET on server ──────────────────────────────────────────────

Deno.test('auth middleware returns 500 when JWT_SECRET is not set', async () => {
  Deno.env.delete('JWT_SECRET');
  const token = await createTestJwt();

  const { status } = await testRequest(makeTestRouter(), '/api/v1/test', {
    token,
  });

  assertEquals(status, 500);
});
