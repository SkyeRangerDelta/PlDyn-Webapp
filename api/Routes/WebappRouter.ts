// Webapp router handler
import { Router } from '@oak/oak/router';
import { send } from '@oak/oak/send';
import { join } from '@std/path/unstable-join';

const router = new Router();
const indexPath = join( Deno.cwd(), 'webapp/dist/webapp/browser' );

router
  .use('/', (ctx) => {
    console.log('WebappRouter main');

    try {
      ctx.send({
        root: indexPath,
        index: 'index.html',
      });
    }
    catch (error) {
      console.log( error );
      ctx.response.status = 500;
      ctx.response.body = 'Internal Server Error'
    }
  });

export { router as WebappRouter };