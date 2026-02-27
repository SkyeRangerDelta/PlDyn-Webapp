import { Application, Router } from '@oak/oak';
import * as jose from 'jose';

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';

/**
 * Create a signed JWT for testing.
 * Defaults to a valid token signed with TEST_SECRET.
 */
export async function createTestJwt(
  opts: { secret?: string; claims?: Record<string, unknown>; expiresIn?: string } = {}
): Promise<string> {
  const secret = opts.secret ?? TEST_SECRET;
  const encoded = new TextEncoder().encode(secret);

  return await new jose.SignJWT({ User: 'testuser', ID: 'test-id', ...opts.claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn ?? '1h')
    .sign(encoded);
}

/**
 * Send a request through an Oak router via app.handle() (no server needed).
 * When a `token` option is provided, the JWT is sent via a `Cookie: pldyn-auth=<jwt>` header
 * (matching the httpOnly cookie the backend now uses). An `Authorization` header fallback
 * is NOT added automatically — tests that need it should set it explicitly in `init.headers`.
 */
export async function testRequest(
  router: Router,
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  const app = new Application();
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Merge cookie header when a token is provided
  const { token, ...requestInit } = init;
  if (token) {
    const existingHeaders = new Headers(requestInit.headers);
    const existingCookie = existingHeaders.get('Cookie');
    const cookieValue = existingCookie
      ? `${existingCookie}; pldyn-auth=${token}`
      : `pldyn-auth=${token}`;
    existingHeaders.set('Cookie', cookieValue);
    requestInit.headers = existingHeaders;
  }

  const request = new Request(`http://localhost${path}`, requestInit);
  const response = await app.handle(request);

  if (!response) return { status: 404, body: null };

  let body = null;
  try {
    body = await response.json();
  } catch { /* non-JSON response */ }

  return { status: response.status, body };
}

export { TEST_SECRET };
