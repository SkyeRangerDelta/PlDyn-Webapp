// Boots the backend

// Imports
import { load } from '@std/dotenv';
import { Application } from '@oak/oak';
import { join } from '@std/path/unstable-join';

import { MainRouter } from "./Routes/MainRouter.ts";

// Env
await load( { export: true } );

// Globals
const app = new Application();

const port = parseInt( Deno.env.get('APP_PORT') || '4200' );
const host = Deno.env.get('APP_HOST') || 'localhost';

// Set Routes
app.use( async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
} );

app.use( MainRouter.routes(), MainRouter.allowedMethods() );

app.use( async (ctx, next) => {
  const indexPath = join( Deno.cwd(), 'webapp/dist/webapp/browser' );

  try {
    await ctx.send({
      root: indexPath,
      index: 'index.html',
    });
  }
  catch {
    await next();
  }
} );

// Error handler
app.use( async ctx => {
  ctx.response.status = 404;
  ctx.response.body = `${ctx.request.url} not found`;
} )

// Start
console.log(`Server running on http://${host}:${port}`);
await app.listen({ port, hostname: host });