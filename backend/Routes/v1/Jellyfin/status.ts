import { Router, RouterContext } from 'https://deno.land/x/oak/mod.ts';

const router = new Router;

router.get('/status', (ctx: RouterContext<string>) => {
  ctx.response.body = 'Jellyfin status';
});

export default {
  name: 'Status',
  router: router
};