import { assertEquals, assertNotEquals } from '@std/assert';
import { testRequest, createTestJwt, TEST_SECRET } from './test_helpers.ts';
import getTokenDataModule from '../Routes/v1/API/GetTokenData.ts';

/** POST JSON with a valid JWT cookie */
async function postTokenData(params: unknown) {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const token = await createTestJwt({
    claims: { AccessToken: 'secret-jf-token-xyz', ID: 'user-42' },
  });

  return testRequest(getTokenDataModule.router, '/GetTokenData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    token,
    body: JSON.stringify({ params }),
  });
}

// ── Allowed claims ───────────────────────────────────────────────────────────

Deno.test('GetTokenData returns User when requested', async () => {
  const { status, body } = await postTokenData(['User']);

  assertEquals(status, 200);
  assertEquals(body?.message, 'Success');
  assertEquals((body?.data as Record<string, unknown>)?.User, 'testuser');
});

Deno.test('GetTokenData returns ID when requested', async () => {
  const { status, body } = await postTokenData(['ID']);

  assertEquals(status, 200);
  assertEquals((body?.data as Record<string, unknown>)?.ID, 'user-42');
});

Deno.test('GetTokenData returns multiple allowed claims', async () => {
  const { status, body } = await postTokenData(['User', 'ID']);

  assertEquals(status, 200);
  const data = body?.data as Record<string, unknown>;
  assertEquals(data?.User, 'testuser');
  assertEquals(data?.ID, 'user-42');
});

// ── Blocked claims ───────────────────────────────────────────────────────────

Deno.test('GetTokenData never returns AccessToken', async () => {
  const { status, body } = await postTokenData(['AccessToken']);

  assertEquals(status, 400);
  assertEquals(body?.message, 'No permitted claims requested.');
});

Deno.test('GetTokenData strips disallowed claims but returns allowed ones', async () => {
  const { status, body } = await postTokenData(['User', 'AccessToken']);

  assertEquals(status, 200);
  const data = body?.data as Record<string, unknown>;
  assertEquals(data?.User, 'testuser');
  assertEquals('AccessToken' in (data ?? {}), false);
});

Deno.test('GetTokenData rejects when all requested claims are disallowed', async () => {
  const { status, body } = await postTokenData(['AccessToken', 'iat', 'exp']);

  assertEquals(status, 400);
  assertEquals(body?.message, 'No permitted claims requested.');
});

// ── Input validation ─────────────────────────────────────────────────────────

Deno.test('GetTokenData rejects non-array params', async () => {
  const { status } = await postTokenData('User');

  assertEquals(status, 400);
});

Deno.test('GetTokenData rejects empty params array', async () => {
  const { status } = await postTokenData([]);

  assertEquals(status, 400);
});

Deno.test('GetTokenData ignores non-string entries in params', async () => {
  const { status, body } = await postTokenData(['User', 123, null]);

  assertEquals(status, 200);
  const data = body?.data as Record<string, unknown>;
  assertEquals(data?.User, 'testuser');
  assertEquals(Object.keys(data ?? {}).length, 1);
});
