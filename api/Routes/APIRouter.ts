// Main router handler
import { Router } from '@oak/oak/router';

const router = new Router();

router
  .get('/api', (ctx) => {
    ctx.response.body = 'Get that bread...';
  })
  .get('/api/:id', (ctx) => {
    ctx.response.body = `Get that bread... ${ctx.params.id}`;
  });

export { router as APIRouter };