import { Router } from '@oak/oak';
import { getAlbumDir, findAlbumCover, detectContentType } from "../../../Utilities/CoverStorage.ts";

const router = new Router();

router.get('/albumcover', async (ctx) => {
  const params = ctx.request.url.searchParams;
  const artist = params.get('artist');
  const album = params.get('album');
  const yearStr = params.get('year');

  if (!artist || !album || !yearStr) {
    ctx.response.status = 400;
    ctx.response.body = { message: 'Missing required parameters.' };
    return;
  }

  const year = parseInt(yearStr, 10);
  if (isNaN(year)) {
    ctx.response.status = 400;
    ctx.response.body = { message: 'Invalid year.' };
    return;
  }

  const albumDir = getAlbumDir(artist, album, year);
  const coverPath = findAlbumCover(albumDir);

  if (!coverPath) {
    ctx.response.status = 404;
    ctx.response.body = { message: 'Cover not found.' };
    return;
  }

  try {
    const data = await Deno.readFile(coverPath);
    const contentType = detectContentType(data);

    ctx.response.headers.set('Content-Type', contentType);
    ctx.response.headers.set('Cache-Control', 'public, max-age=86400');
    ctx.response.body = data;
  } catch {
    ctx.response.status = 404;
    ctx.response.body = { message: 'Cover not found.' };
  }
});

export default {
  name: 'AlbumCover',
  router: router
};
