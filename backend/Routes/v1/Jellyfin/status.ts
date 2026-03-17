import { Router, RouterContext } from '@oak/oak';

const router = new Router;

router.get('/status', async (ctx: RouterContext<string>) => {
  const jellyfinHost = Deno.env.get('JELLYFIN_HOST') || 'http://localhost:8096';

  try {
    const res = await fetch(`${jellyfinHost}/System/Ping`, {
      signal: AbortSignal.timeout(5000)
    });
    await res.body?.cancel();

    ctx.response.body = {
      status: 200,
      jellyfin: res.ok ? 'online' : 'error',
      message: res.ok ? 'Jellyfin is reachable' : `Jellyfin returned ${res.status}`
    };
  } catch {
    ctx.response.body = {
      status: 200,
      jellyfin: 'offline',
      message: 'Unable to reach Jellyfin server'
    };
  }
});

export default {
  name: 'Status',
  router: router
};