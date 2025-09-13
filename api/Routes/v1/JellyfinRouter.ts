// api/Routes/JellyfinRouter.ts
import { Router } from 'https://deno.land/x/oak/mod.ts';
import { getRouter } from "./RouteLoader.ts";

const JellyfinRouter: Router = await getRouter('Jellyfin');

JellyfinRouter
  .get('/', (ctx) => {
    ctx.response.body = 'Jellyfin main route';
  });

for ( const route of JellyfinRouter.values() ) {
  console.log( `[Router] [Jellyfin] Loaded ${ route.path } route` );
}

export { JellyfinRouter };