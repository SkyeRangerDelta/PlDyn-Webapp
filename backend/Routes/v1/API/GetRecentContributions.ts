import { Router, RouterContext } from '@oak/oak';
import { DBHandler } from "../../../Utilities/DBHandler.ts";
import { JellyfinContributionsResponse } from "../../../Types/API_ObjectTypes.ts";

const router = new Router();

router
  .post('/GetRecentContributions', async ( ctx: RouterContext<string> ) => {
    const Mongo: DBHandler = ctx.state.Mongo;
    const userId = ctx.state.userId as string | undefined;

    if ( !userId || typeof userId !== 'string' ) {
      ctx.response.status = 401;
      ctx.response.body = {
        message: 'Unauthorized',
        data: {
          contributions: [],
          errorMessage: 'Missing user identity.'
        }
      } as JellyfinContributionsResponse;
      return;
    }

    const settingsRes = await Mongo.selectOneByFilter( 'UserContributions', { jfId: userId } );

    if ( !settingsRes ) {
      ctx.response.status = 200;
      ctx.response.body = {
        message: 'No Contributions',
        data: {
          contributions: [],
          errorMessage: 'No contributions found.'
        }
      } as JellyfinContributionsResponse;

      return;
    }

    ctx.response.body = {
      message: 'Success',
      data: {
        contributions: settingsRes.contributions ?? [],
        errorMessage: ''
      }
    } as JellyfinContributionsResponse;
  });

export default {
  name: 'GetRecentContributions',
  router: router
};
