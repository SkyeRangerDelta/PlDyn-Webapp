import { Router, RouterContext } from '@oak/oak';

const router = new Router();

router.post('/watch-ticket', (ctx: RouterContext<string>) => {
  const ticketStore = ctx.state.ticketStore;

  if (!ticketStore) {
    ctx.response.status = 500;
    ctx.response.body = { message: 'Internal Server Error' };
    return;
  }

  const userId = ctx.state.userId as string | undefined;
  if (!userId) {
    ctx.response.status = 401;
    ctx.response.body = { message: 'Missing user identity.' };
    return;
  }

  const ticket = ticketStore.create(userId);

  ctx.response.body = { ticket };
});

export default {
  name: 'WatchTicket',
  router: router
};
