import { assertEquals, assertNotEquals } from '@std/assert';
import { generateRandomString } from '../Utilities/Generators.ts';

// ── Cryptographic quality ─────────────────────────────────────────────────────

Deno.test('generateRandomString returns a base64 string of 256-bit entropy', () => {
  const result = generateRandomString();

  // 32 bytes → 44 chars in base64 (with padding)
  assertEquals(result.length, 44);

  // Should be valid base64
  const decoded = atob(result);
  assertEquals(decoded.length, 32);
});

Deno.test('generateRandomString produces unique values on successive calls', () => {
  const results = new Set<string>();

  for (let i = 0; i < 100; i++) {
    results.add(generateRandomString());
  }

  // All 100 should be unique (collision probability is astronomically low with 256 bits)
  assertEquals(results.size, 100);
});

Deno.test('generateRandomString does not produce predictable output', () => {
  // Two consecutive calls should never match
  const a = generateRandomString();
  const b = generateRandomString();
  assertNotEquals(a, b);
});
