import { Router, RouterContext, ServerSentEvent } from '@oak/oak';
import * as jose from 'jose';

const router = new Router();

router.get('/watch', async (ctx: RouterContext<string>) => {
  // EventSource doesn't support custom headers, so JWT is passed as a query param
  const token = ctx.request.url.searchParams.get('token');

  if (!token) {
    ctx.response.status = 401;
    ctx.response.body = { message: 'Unauthorized (no token)' };
    return;
  }

  // Verify JWT signature and expiry
  try {
    const secret = new TextEncoder().encode(Deno.env.get('JWT_SECRET'));
    await jose.jwtVerify(token, secret);
  } catch {
    ctx.response.status = 401;
    ctx.response.body = { message: 'Invalid token.' };
    return;
  }

  // Open SSE connection
  const target = await ctx.sendEvents();

  // Register listener on the TempFileWatcher from app state
  const watcher = ctx.state.tempFileWatcher;
  const unsubscribe = watcher.addListener((fileName: string) => {
    target.dispatchEvent(
      new ServerSentEvent('file-removed', { data: JSON.stringify({ fileName }) })
    );
  });

  // Clean up listener on client disconnect
  target.addEventListener('close', () => {
    unsubscribe();
  });
});

export default {
  name: 'Watch',
  router: router
};
