import { Router, RouterContext } from '@oak/oak';

const router = new Router();

router.post('/watch-ticket', (ctx: RouterContext<string>) => {
  const ticketStore = ctx.state.ticketStore;

  if (!ticketStore) {
    ctx.response.status = 500;
    ctx.response.body = { message: 'Internal Server Error' };
    return;
  }

  const ticket = ticketStore.create();

  ctx.response.body = { ticket };
});

export default {
  name: 'WatchTicket',
  router: router
};
