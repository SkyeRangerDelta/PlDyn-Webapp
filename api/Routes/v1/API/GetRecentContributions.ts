import { Router, RouterContext } from '@oak/oak/router';
import { DBHandler } from "../../../Utilities/DBHandler.ts";

const router = new Router();

router
  .post('/GetRecentContributions', async ( ctx: RouterContext<string> ) => {
    const Mongo: DBHandler = ctx.state.Mongo;

    const req = await ctx.request.body.json();

    if ( !req || !req.uid ) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: 'Bad Request',
        data: {
          error: 'Invalid request body.'
        }
      }
    }

    const uId = req.uid;
    const settingsRes = await Mongo.selectOneByFilter( 'UserContributions', { jfId: uId } );

    if ( !settingsRes ) {
      ctx.response.status = 200;
      ctx.response.body = {
        message: 'No Contributions',
        data: {
          contributions: []
        }
      }
    }

    ctx.response.body = {
      message: 'Success',
      data: {
        contributions: req.contributions
      }
    }
  });

export default {
  name: 'GetRecentContributions',
  router: router
};