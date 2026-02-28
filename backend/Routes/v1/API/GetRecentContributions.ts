import { Router, RouterContext } from '@oak/oak';
import { DBHandler } from "../../../Utilities/DBHandler.ts";
import { JellyfinContribution, JellyfinContributionsResponse } from "../../../Types/API_ObjectTypes.ts";

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
          totalAlbums: 0,
          totalSongs: 0,
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
          totalAlbums: 0,
          totalSongs: 0,
          errorMessage: 'No contributions found.'
        }
      } as JellyfinContributionsResponse;

      return;
    }

    const contributions: JellyfinContribution[] = settingsRes.contributions ?? [];
    const totalAlbums = contributions.length;
    const totalSongs = contributions.reduce((sum, c) => sum + c.songCount, 0);
    const recent = [...contributions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    ctx.response.body = {
      message: 'Success',
      data: {
        contributions: recent,
        totalAlbums,
        totalSongs,
        errorMessage: ''
      }
    } as JellyfinContributionsResponse;
  });

export default {
  name: 'GetRecentContributions',
  router: router
};
