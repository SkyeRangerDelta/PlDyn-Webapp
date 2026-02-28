import { Router, RouterContext } from '@oak/oak';
import { DBHandler } from "../../../Utilities/DBHandler.ts";
import { JellyfinContributionsResponse } from "../../../Types/API_ObjectTypes.ts";

const router = new Router();

router
  .post('/GetRecentContributions', async ( ctx: RouterContext<string> ) => {
    const Mongo: DBHandler = ctx.state.Mongo;

    const req = await ctx.request.body.json();

    if ( !req || !req.uid || typeof req.uid !== 'string' ) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: 'Bad Request',
        data: {
          contributions: [],
          errorMessage: 'Invalid request body.'
        }
      } as JellyfinContributionsResponse;
      return;
    }

    const uId = req.uid;
    const settingsRes = await Mongo.selectOneByFilter( 'UserContributions', { jfId: uId } );

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