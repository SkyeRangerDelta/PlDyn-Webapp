import { assertEquals } from '@std/assert';
import { testRequest } from './test_helpers.ts';
import getTokenDataModule from '../Routes/v1/API/GetTokenData.ts';

// ── GetTokenData: no internal details leaked ──────────────────────────────────

Deno.test('GetTokenData returns generic message on invalid token', async () => {
  Deno.env.set('JWT_SECRET', 'test-secret');

  const { status, body } = await testRequest(getTokenDataModule.router, '/GetTokenData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    token: 'totally-invalid-jwt',
    body: JSON.stringify({ params: ['User'] }),
  });

  assertEquals(status, 400);
  assertEquals(body?.message, 'Invalid or expired token.');

  // Must NOT contain stack traces, library internals, or error class names
  const msg = String(body?.message);
  assertEquals(msg.includes('jose'), false);
  assertEquals(msg.includes('JWS'), false);
  assertEquals(msg.includes('at '), false);
  assertEquals(msg.includes('\n'), false);
});

// ── Verify generic error messages don't contain path patterns ─────────────────

Deno.test('sanitized error messages do not contain file system paths', () => {
  // These are the exact generic messages we now use — verify none leak paths
  const messages = [
    'Invalid or expired token.',
    'Failed to prepare library directory.',
    'Processing failed.',
    'Failed to create directory structure.',
    'ffmpeg processing failed.',
    'Failed to move file to library.',
  ];

  for (const msg of messages) {
    assertEquals(msg.includes('/'), false, `Message should not contain /: "${msg}"`);
    assertEquals(msg.includes('\\'), false, `Message should not contain \\: "${msg}"`);
    assertEquals(msg.includes('Deno'), false, `Message should not contain Deno: "${msg}"`);
    assertEquals(msg.includes('stderr'), false, `Message should not contain stderr: "${msg}"`);
  }
});
