import { Router, RouterContext } from '@oak/oak/router';
import { DBHandler } from "../../../Utilities/DBHandler.ts";

const router = new Router();

router
  .post('/GetSettings', async ( ctx: RouterContext<string> ) => {
    const Mongo: DBHandler = ctx.state.Mongo;

    const uId = ctx.request.body.json();
    const settingsRes = await Mongo.selectOne( 'settings', 1 );

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