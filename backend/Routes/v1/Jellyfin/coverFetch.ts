import { Router } from '@oak/oak';
import { detectContentType } from '../../../Utilities/CoverStorage.ts';
import { buildImgB64 } from '../../../Utilities/Formatters.ts';

const router = new Router();

const ALLOWED_DOMAINS = [
  'coverartarchive.org',
  'archive.org',
  'mzstatic.com'
];

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB

function isDomainAllowed(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

router.post('/cover-fetch', async (ctx) => {
  const body = ctx.request.body;

  if (!ctx.request.hasBody || body.type() !== 'json') {
    ctx.response.status = 400;
    ctx.response.body = { status: 400, message: 'Invalid request body', cover: null };
    return;
  }

  const { url } = await body.json();

  if (!url || typeof url !== 'string') {
    ctx.response.status = 400;
    ctx.response.body = { status: 400, message: 'Missing url parameter', cover: null };
    return;
  }

  if (!isDomainAllowed(url)) {
    ctx.response.status = 403;
    ctx.response.body = { status: 403, message: 'Domain not allowed', cover: null };
    return;
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PlDyn-Webapp/1.0.0 (https://github.com/SkyeRangerDelta/PlDyn-Webapp)' },
      redirect: 'follow'
    });

    if (!res.ok) {
      ctx.response.status = 502;
      ctx.response.body = { status: 502, message: `Upstream returned ${res.status}`, cover: null };
      return;
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      ctx.response.status = 413;
      ctx.response.body = { status: 413, message: 'Image too large', cover: null };
      return;
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
      ctx.response.status = 413;
      ctx.response.body = { status: 413, message: 'Image too large', cover: null };
      return;
    }

    const data = new Uint8Array(arrayBuffer);
    const contentType = res.headers.get('content-type')?.split(';')[0].trim() || detectContentType(data);
    const dataUri = buildImgB64(data, contentType);

    ctx.response.status = 200;
    ctx.response.body = {
      status: 200,
      message: 'OK',
      cover: { format: contentType, data: dataUri }
    };
  } catch (e) {
    console.error('Cover fetch error:', e);
    ctx.response.status = 502;
    ctx.response.body = { status: 502, message: 'Failed to fetch image', cover: null };
  }
});

export default {
  name: 'CoverFetch',
  router
};
