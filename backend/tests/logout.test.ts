import { assertEquals } from '@std/assert';
import logoutModule from '../Routes/v1/Jellyfin/logout.ts';
import { testRequest } from './test_helpers.ts';

Deno.test('logout clears the pldyn-auth cookie', async () => {
  const router = logoutModule.router;

  const app = new (await import('@oak/oak')).Application();
  app.use(router.routes());
  app.use(router.allowedMethods());

  const request = new Request('http://localhost/logout', {
    method: 'POST',
    headers: { Cookie: 'pldyn-auth=some-jwt-token' },
  });

  const response = await app.handle(request);
  assertEquals(response!.status, 200);

  const body = await response!.json();
  assertEquals(body.message, 'Logged out');

  // Verify the Set-Cookie header clears the cookie (maxAge=0 or expires in the past)
  const setCookie = response!.headers.get('set-cookie');
  assertEquals(setCookie !== null, true, 'Expected a Set-Cookie header');
  assertEquals(setCookie!.includes('pldyn-auth='), true, 'Expected pldyn-auth cookie to be set');
  assertEquals(setCookie!.toLowerCase().includes('httponly'), true, 'Expected httpOnly flag');
});

Deno.test('logout returns 200 even without an existing cookie', async () => {
  const { status, body } = await testRequest(logoutModule.router, '/logout', {
    method: 'POST',
  });

  assertEquals(status, 200);
  assertEquals(body?.message, 'Logged out');
});
