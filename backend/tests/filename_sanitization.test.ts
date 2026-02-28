import { assertEquals } from '@std/assert';
import { isSafeFileName } from '../Utilities/IOUtilities.ts';

// ── isSafeFileName unit tests ────────────────────────────────────────────────

Deno.test('isSafeFileName rejects forward slash traversal', () => {
  assertEquals(isSafeFileName('../etc/passwd'), false);
  assertEquals(isSafeFileName('../../.env'), false);
  assertEquals(isSafeFileName('foo/bar.mp3'), false);
});

Deno.test('isSafeFileName rejects backslash traversal', () => {
  assertEquals(isSafeFileName('..\\windows\\system32'), false);
  assertEquals(isSafeFileName('foo\\bar.mp3'), false);
});

Deno.test('isSafeFileName rejects bare dot references', () => {
  assertEquals(isSafeFileName('.'), false);
  assertEquals(isSafeFileName('..'), false);
});

Deno.test('isSafeFileName rejects empty and non-string values', () => {
  assertEquals(isSafeFileName(''), false);
  assertEquals(isSafeFileName(null), false);
  assertEquals(isSafeFileName(undefined), false);
  assertEquals(isSafeFileName(12345), false);
  assertEquals(isSafeFileName({}), false);
});

Deno.test('isSafeFileName accepts normal filenames', () => {
  assertEquals(isSafeFileName('song.mp3'), true);
  assertEquals(isSafeFileName('My Song (feat. Artist).flac'), true);
  assertEquals(isSafeFileName('track 01.wav'), true);
  assertEquals(isSafeFileName('...flac'), true);  // leading dots without traversal
  assertEquals(isSafeFileName('.hidden-file'), true);
});
