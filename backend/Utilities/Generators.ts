/**
 * Generates a cryptographically secure random string (for JWT secret).
 * Returns 32 bytes (256 bits) encoded as base64.
 */
export function generateRandomString(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
