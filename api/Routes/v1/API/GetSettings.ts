import { Router, RouterContext } from '@oak/oak/router';
import { DBHandler } from "../../../Utilities/DBHandler.ts";

const router = new Router();

router
  .post('/GetSettings', async ( ctx: RouterContext<string> ) => {
    const Mongo: DBHandler = ctx.state.Mongo;

    const uId = await ctx.request.body.json();
    const settingsRes = await Mongo.selectOneByFilter( 'UserSettings', { jfId: uId } );

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