import { assertEquals } from '@std/assert';
import { Router } from '@oak/oak';
import clearModule from '../Routes/v1/Jellyfin/clear.ts';
import { testRequest } from './test_helpers.ts';

const TEST_USER_ID = 'test-user-42';
const TEMP_DIR = `${Deno.cwd()}/temp/audio-uploads/${TEST_USER_ID}`;

/** Wrap the clear router with middleware that injects a fake userId. */
function makeClearRouter(): Router {
  const wrapper = new Router();
  wrapper.use(async (ctx, next) => {
    ctx.state.userId = TEST_USER_ID;
    await next();
  });
  wrapper.use(clearModule.router.routes());
  wrapper.use(clearModule.router.allowedMethods());
  return wrapper;
}

/** POST JSON to the /clear endpoint via app.handle(). */
async function postClear(body: Record<string, unknown>) {
  return await testRequest(makeClearRouter(), '/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Create a temp file for testing and return its name. */
async function createTempFile(name: string): Promise<string> {
  await Deno.mkdir(TEMP_DIR, { recursive: true });
  await Deno.writeTextFile(`${TEMP_DIR}/${name}`, 'test-content');
  return name;
}

/** Check whether a file exists. */
async function fileExists(name: string): Promise<boolean> {
  try {
    await Deno.stat(`${TEMP_DIR}/${name}`);
    return true;
  } catch {
    return false;
  }
}

// ── Filename validation ───────────────────────────────────────────────────────

Deno.test('clear rejects filename with forward slash', async () => {
  const { status, body } = await postClear({ fileName: '../etc/passwd' });
  assertEquals(status, 400);
  assertEquals(body?.error, true);
});

Deno.test('clear rejects filename with backslash', async () => {
  const { status, body } = await postClear({ fileName: '..\\windows\\system32' });
  assertEquals(status, 400);
  assertEquals(body?.error, true);
});

Deno.test('clear rejects empty filename', async () => {
  const { status, body } = await postClear({ fileName: '' });
  assertEquals(status, 400);
  assertEquals(body?.error, true);
});

Deno.test('clear rejects missing fileName field', async () => {
  const { status, body } = await postClear({});
  assertEquals(status, 400);
  assertEquals(body?.error, true);
});

Deno.test('clear rejects non-string fileName', async () => {
  const { status, body } = await postClear({ fileName: 12345 });
  assertEquals(status, 400);
  assertEquals(body?.error, true);
});

// ── Valid filenames ───────────────────────────────────────────────────────────

Deno.test('clear accepts a normal filename and deletes the file', async () => {
  const name = await createTempFile('test-delete-me.mp3');

  const { status, body } = await postClear({ fileName: name });
  assertEquals(status, 200);
  assertEquals(body?.error, false);
  assertEquals(await fileExists(name), false);
});

Deno.test('clear accepts filenames with leading dots like ...flac', async () => {
  const name = await createTempFile('...flac');

  const { status, body } = await postClear({ fileName: name });
  assertEquals(status, 200);
  assertEquals(body?.error, false);
  assertEquals(await fileExists(name), false);
});

// ── Non-existent file ─────────────────────────────────────────────────────────

Deno.test('clear returns 500 for a file that does not exist', async () => {
  // Ensure the user directory exists so we don't get a different error
  await Deno.mkdir(TEMP_DIR, { recursive: true });

  const { status, body } = await postClear({ fileName: 'no-such-file.mp3' });
  assertEquals(status, 500);
  assertEquals(body?.error, true);
});

// ── Directory rejection ───────────────────────────────────────────────────────

Deno.test('clear rejects deletion of a directory', async () => {
  const dirName = 'test-dir-should-not-delete';
  await Deno.mkdir(`${TEMP_DIR}/${dirName}`, { recursive: true });

  const { status, body } = await postClear({ fileName: dirName });
  assertEquals(status, 400);
  assertEquals(body?.message, 'Target is not a file.');

  // Directory should still exist
  assertEquals(await fileExists(dirName), true);

  // Cleanup
  await Deno.remove(`${TEMP_DIR}/${dirName}`);
});

// ── Missing userId rejects ───────────────────────────────────────────────────

Deno.test('clear rejects request without userId in state', async () => {
  // Use the raw router without the userId middleware
  const { status, body } = await testRequest(clearModule.router, '/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: 'test.mp3' }),
  });

  assertEquals(status, 401);
  assertEquals(body?.message, 'Missing user identity.');
});
