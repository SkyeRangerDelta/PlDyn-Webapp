import { Router, RouterContext } from '@oak/oak';

const router = new Router;

router.get('/status', (ctx: RouterContext<string>) => {
  ctx.response.body = 'Jellyfin status';
});

export default {
  name: 'Status',
  router: router
};