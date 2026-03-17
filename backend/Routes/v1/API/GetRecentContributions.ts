import { Router, RouterContext } from '@oak/oak';
import { DBHandler } from "../../../Utilities/DBHandler.ts";
import { getAlbumDir, findAlbumCover } from "../../../Utilities/CoverStorage.ts";
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
          totalPages: 0,
          currentPage: 0,
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
          totalPages: 0,
          currentPage: 0,
          errorMessage: 'No contributions found.'
        }
      } as JellyfinContributionsResponse;

      return;
    }

    const body = await ctx.request.body.json().catch(() => ({}));
    const page = Math.max(1, parseInt(body.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(body.limit) || 10));

    const contributions: JellyfinContribution[] = settingsRes.contributions ?? [];
    const totalAlbums = contributions.length;
    const totalSongs = contributions.reduce((sum, c) => sum + c.songCount, 0);
    const totalPages = Math.max(1, Math.ceil(totalAlbums / limit));

    const sorted = [...contributions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const paginated = sorted.slice((page - 1) * limit, page * limit);

    // Resolve cover URLs from album directories
    for (const contrib of paginated) {
      const albumDir = getAlbumDir(contrib.albumArtist, contrib.album, contrib.year);
      const coverPath = findAlbumCover(albumDir);
      contrib.coverUrl = coverPath
        ? `/api/v1/albumcover?artist=${encodeURIComponent(contrib.albumArtist)}&album=${encodeURIComponent(contrib.album)}&year=${contrib.year}`
        : null;
    }

    ctx.response.body = {
      message: 'Success',
      data: {
        contributions: paginated,
        totalAlbums,
        totalSongs,
        totalPages,
        currentPage: page,
        errorMessage: ''
      }
    } as JellyfinContributionsResponse;
  });

export default {
  name: 'GetRecentContributions',
  router: router
};
