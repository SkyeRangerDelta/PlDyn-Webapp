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
 */
export async function testRequest(
  router: Router,
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  const app = new Application();
  app.use(router.routes());
  app.use(router.allowedMethods());

  const request = new Request(`http://localhost${path}`, init);
  const response = await app.handle(request);

  if (!response) return { status: 404, body: null };

  let body = null;
  try {
    body = await response.json();
  } catch { /* non-JSON response */ }

  return { status: response.status, body };
}

export { TEST_SECRET };
