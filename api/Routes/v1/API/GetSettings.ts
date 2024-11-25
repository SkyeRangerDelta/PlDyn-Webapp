import { Router, RouterContext } from '@oak/oak/router';

const router = new Router();

router
  .post('/GetSettings', async ( ctx: RouterContext<string> ) => {

    ctx.response.body = {
      message: 'Success',
      data: {
        theme: 'dark',
      }
    }
  });

export default {
  name: 'GetSettings',
  router: router
};