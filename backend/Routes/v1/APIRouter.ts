// Main router handler
import { Router } from '@oak/oak';
import { getRouter } from "./RouteLoader.ts";

const APIRouter: Router = await getRouter('API');

APIRouter
  .get('/', (ctx) => {
    ctx.response.body = 'API main route';
  });

for ( const route of APIRouter.values() ) {
  console.log( `[Router] [API] Loaded ${ route.path } route` );
}

export { APIRouter };