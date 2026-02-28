import { assertEquals } from '@std/assert';
import { Application } from '@oak/oak';

/**
 * Reproduce the 404 handler from main.ts and verify it does NOT leak
 * the request URL in the response body.
 */
async function request404(path: string): Promise<{ status: number; body: string }> {
  const app = new Application();

  // 404 handler (mirrors main.ts)
  app.use(async (ctx) => {
    ctx.response.status = 404;
    ctx.response.body = { message: 'Not found' };
  });

  const response = await app.handle(new Request(`http://localhost${path}`));
  const body = await response!.text();
  return { status: response!.status, body };
}

Deno.test('404 response does not contain the request URL', async () => {
  const path = '/some/random/path?secret=value';
  const { status, body } = await request404(path);

  assertEquals(status, 404);
  assertEquals(body.includes(path), false, '404 body must not echo the request URL');
  assertEquals(body.includes('secret=value'), false, '404 body must not echo query params');
});

Deno.test('404 response returns generic JSON message', async () => {
  const { body } = await request404('/does-not-exist');
  const parsed = JSON.parse(body);

  assertEquals(parsed.message, 'Not found');
});
