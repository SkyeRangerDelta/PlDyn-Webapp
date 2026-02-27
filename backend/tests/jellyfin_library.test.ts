import { assertEquals } from '@std/assert';
import { extractJellyfinToken } from '../Utilities/JellyfinLibrary.ts';
import { createTestJwt, TEST_SECRET } from './test_helpers.ts';

// ── Returns AccessToken from a validly signed JWT ────────────────────────────

Deno.test('extractJellyfinToken returns AccessToken from a valid JWT', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const token = await createTestJwt({ claims: { AccessToken: 'jf-abc-123' } });

  const result = await extractJellyfinToken(token);
  assertEquals(result, 'jf-abc-123');
});

// ── Returns undefined when JWT is signed with a different secret ─────────────

Deno.test('extractJellyfinToken rejects a forged JWT', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const forged = await createTestJwt({
    secret: 'wrong-secret',
    claims: { AccessToken: 'should-not-return' },
  });

  const result = await extractJellyfinToken(forged);
  assertEquals(result, undefined);
});

// ── Returns undefined when JWT is expired ────────────────────────────────────

Deno.test('extractJellyfinToken rejects an expired JWT', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const expired = await createTestJwt({
    claims: { AccessToken: 'should-not-return' },
    expiresIn: '-1h',
  });

  const result = await extractJellyfinToken(expired);
  assertEquals(result, undefined);
});

// ── Returns undefined when JWT_SECRET is not set ─────────────────────────────

Deno.test('extractJellyfinToken returns undefined when JWT_SECRET is missing', async () => {
  Deno.env.delete('JWT_SECRET');
  const token = await createTestJwt({ claims: { AccessToken: 'jf-abc-123' } });

  const result = await extractJellyfinToken(token);
  assertEquals(result, undefined);
});

// ── Returns undefined when AccessToken claim is absent ───────────────────────

Deno.test('extractJellyfinToken returns undefined when AccessToken claim is missing', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);
  const token = await createTestJwt(); // no AccessToken claim

  const result = await extractJellyfinToken(token);
  assertEquals(result, undefined);
});

// ── Returns undefined for garbage input ──────────────────────────────────────

Deno.test('extractJellyfinToken returns undefined for malformed input', async () => {
  Deno.env.set('JWT_SECRET', TEST_SECRET);

  assertEquals(await extractJellyfinToken('not-a-jwt'), undefined);
  assertEquals(await extractJellyfinToken(''), undefined);
});
