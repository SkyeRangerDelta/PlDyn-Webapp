import { Router, RouterContext } from 'https://deno.land/x/oak/mod.ts';
import { DBHandler } from "../../../Utilities/DBHandler.ts";
import { ClientSettingsResult } from "../../../../frontend/src/app/customTypes.ts";

const router = new Router();

router
  .post('/GetSettings', async ( ctx: RouterContext<string> ) => {
    const Mongo: DBHandler = ctx.state.Mongo;

    const uId = await ctx.request.body.json();
    const settingsRes = await Mongo.selectOneByFilter( 'UserSettings', { jfId: uId } );

    ctx.response.body = {
      status: 200,
      message: 'Success',
      settings: settingsRes,
      success: true
    } as ClientSettingsResult;
  });

export default {
  name: 'GetSettings',
  router: router
};
