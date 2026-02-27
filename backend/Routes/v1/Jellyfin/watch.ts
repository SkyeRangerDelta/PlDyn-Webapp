import { Router, RouterContext, ServerSentEvent } from '@oak/oak';

const router = new Router();

router.get('/watch', async (ctx: RouterContext<string>) => {
  // Use a short-lived, single-use ticket instead of the long-lived JWT
  const ticket = ctx.request.url.searchParams.get('ticket');

  if (!ticket) {
    ctx.response.status = 401;
    ctx.response.body = { message: 'Unauthorized (no ticket)' };
    return;
  }

  const ticketStore = ctx.state.ticketStore;
  const userId = ticketStore?.validate(ticket);
  if (!userId) {
    ctx.response.status = 401;
    ctx.response.body = { message: 'Invalid or expired ticket.' };
    return;
  }

  // Open SSE connection
  const target = await ctx.sendEvents();

  // Register listener on the TempFileWatcher from app state.
  // Only forward events that belong to this user.
  const watcher = ctx.state.tempFileWatcher;
  const unsubscribe = watcher.addListener((eventUserId: string, fileName: string) => {
    if (eventUserId !== userId) return;
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
