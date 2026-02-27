import { assertEquals } from '@std/assert';
import { Router } from '@oak/oak';
import logoutModule from '../Routes/v1/Jellyfin/logout.ts';
import { authMiddleware } from '../Routes/MainRouter.ts';
import { createTestJwt, testRequest, TEST_SECRET } from './test_helpers.ts';

/** Build a router with the real auth middleware + the logout route. */
function makeLogoutRouter(): Router {
  const router = new Router();
  router.use(authMiddleware);
  router.use(logoutModule.router.routes());
  router.use(logoutModule.router.allowedMethods());
  return router;
}

// ── Authenticated logout ─────────────────────────────────────────────────────

Deno.test('logout clears the pldyn-auth cookie for an authenticated user', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const token = await createTestJwt();
  const router = makeLogoutRouter();

  const app = new (await import('@oak/oak')).Application();
  app.use(router.routes());
  app.use(router.allowedMethods());

  const request = new Request('http://localhost/logout', {
    method: 'POST',
    headers: { Cookie: `pldyn-auth=${token}` },
  });

  const response = await app.handle(request);
  assertEquals(response!.status, 200);

  const body = await response!.json();
  assertEquals(body.message, 'Logged out');

  // Verify the Set-Cookie header clears the cookie (maxAge=0)
  const setCookie = response!.headers.get('set-cookie');
  assertEquals(setCookie !== null, true, 'Expected a Set-Cookie header');
  assertEquals(setCookie!.includes('pldyn-auth='), true, 'Expected pldyn-auth cookie to be set');
  assertEquals(setCookie!.toLowerCase().includes('httponly'), true, 'Expected httpOnly flag');
});

// ── Unauthenticated logout is rejected ───────────────────────────────────────

Deno.test('logout rejects unauthenticated requests', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);

  const { status, body } = await testRequest(makeLogoutRouter(), '/logout', {
    method: 'POST',
  });

  assertEquals(status, 401);
  assertEquals(body?.message, 'Unauthorized (no token)');
});

// ── Forged token cannot trigger logout ───────────────────────────────────────

Deno.test('logout rejects a forged token', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const forged = await createTestJwt({ secret: 'wrong-secret' });

  const { status, body } = await testRequest(makeLogoutRouter(), '/logout', {
    method: 'POST',
    token: forged,
  });

  assertEquals(status, 401);
  assertEquals(body?.message, 'Invalid token.');
});
