import { Router } from '@oak/oak';
import { CoverArtSearchResult } from '../../../../frontend/src/app/customTypes.ts';

const router = new Router();

const USER_AGENT = 'PlDyn-Webapp/1.0.0 (https://github.com/SkyeRangerDelta/PlDyn-Webapp)';

// Simple throttle: track last request time to MusicBrainz (1 req/sec)
let lastMBRequest = 0;

async function throttledFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastMBRequest;
  if (elapsed < 1100) {
    await new Promise(resolve => setTimeout(resolve, 1100 - elapsed));
  }
  lastMBRequest = Date.now();
  return fetch(url, { headers: { 'User-Agent': USER_AGENT } });
}

interface MBRelease {
  id: string;
  title: string;
  'artist-credit'?: Array<{ name: string }>;
  date?: string;
}

interface MBSearchResponse {
  releases?: MBRelease[];
}

interface CAAImage {
  thumbnails?: { 250?: string; small?: string };
  image?: string;
}

interface CAAResponse {
  images?: CAAImage[];
}

router.get('/cover-search', async (ctx) => {
  const params = ctx.request.url.searchParams;
  const artist = params.get('artist');
  const album = params.get('album');

  if (!artist || !album) {
    ctx.response.status = 400;
    ctx.response.body = { status: 400, message: 'Missing artist or album parameter', results: [] };
    return;
  }

  const results: CoverArtSearchResult[] = [];

  try {
    // Query MusicBrainz
    const mbQuery = encodeURIComponent(`release:"${album}" AND artist:"${artist}"`);
    const mbUrl = `https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=10`;
    const mbRes = await throttledFetch(mbUrl);

    if (mbRes.ok) {
      const mbData: MBSearchResponse = await mbRes.json();

      if (mbData.releases) {
        // Check CAA for each release (in parallel, up to 10)
        const caaChecks = mbData.releases.map(async (release) => {
          try {
            const caaRes = await fetch(`https://coverartarchive.org/release/${release.id}/`, {
              headers: { 'User-Agent': USER_AGENT },
              redirect: 'follow'
            });

            if (!caaRes.ok) return null;

            const caaData: CAAResponse = await caaRes.json();
            if (!caaData.images || caaData.images.length === 0) return null;

            const firstImage = caaData.images[0];
            const thumbnailUrl = firstImage.thumbnails?.['250'] || firstImage.thumbnails?.small || '';
            const fullUrl = firstImage.image || '';

            if (!thumbnailUrl && !fullUrl) return null;

            return {
              releaseId: release.id,
              title: release.title,
              artist: release['artist-credit']?.map(ac => ac.name).join(', ') || artist,
              date: release.date || '',
              thumbnailUrl: thumbnailUrl || fullUrl,
              fullUrl: fullUrl || thumbnailUrl,
              source: 'musicbrainz' as const
            };
          } catch {
            return null;
          }
        });

        const caaResults = await Promise.all(caaChecks);
        for (const r of caaResults) {
          if (r) results.push(r);
        }
      }
    }
  } catch (e) {
    console.error('MusicBrainz search error:', e);
  }

  // Fallback to iTunes if no MusicBrainz results have art
  if (results.length === 0) {
    try {
      const itunesQuery = encodeURIComponent(`${artist} ${album}`);
      const itunesUrl = `https://itunes.apple.com/search?term=${itunesQuery}&media=music&entity=album&limit=10`;
      const itunesRes = await fetch(itunesUrl, { headers: { 'User-Agent': USER_AGENT } });

      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();

        for (const result of itunesData.results || []) {
          const artworkUrl = result.artworkUrl100 || '';
          if (!artworkUrl) continue;

          results.push({
            releaseId: String(result.collectionId || ''),
            title: result.collectionName || '',
            artist: result.artistName || '',
            date: result.releaseDate || '',
            thumbnailUrl: artworkUrl.replace('100x100bb', '250x250bb'),
            fullUrl: artworkUrl.replace('100x100bb', '600x600bb'),
            source: 'itunes'
          });
        }
      }
    } catch (e) {
      console.error('iTunes search error:', e);
    }
  }

  ctx.response.status = 200;
  ctx.response.body = { status: 200, message: 'OK', results };
});

export default {
  name: 'CoverSearch',
  router
};
