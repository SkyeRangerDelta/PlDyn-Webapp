// api/Routes/JellyfinRouter.ts
import { Router } from '@oak/oak/router';

const JellyfinRouter = new Router();

JellyfinRouter
  .get('/', (ctx) => {
    ctx.response.body = 'Jellyfin main route';
  })
  .get('/status', (ctx) => {
    ctx.response.body = 'Jellyfin status';
  });

export { JellyfinRouter };