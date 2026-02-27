// Main router handler
import { Router, RouterContext } from '@oak/oak';
import * as jose from 'jose';

import { APIRouter } from "./v1/APIRouter.ts";
import { JellyfinRouter } from "./v1/JellyfinRouter.ts";

const MainRouter = new Router();

MainRouter.use( authMiddleware );
MainRouter.use( '/api/v1/jellyfin', JellyfinRouter.routes(), JellyfinRouter.allowedMethods());
MainRouter.use( '/api/v1', APIRouter.routes(), APIRouter.allowedMethods());

export { MainRouter };

async function authMiddleware( ctx: RouterContext<string>, next: () => Promise<unknown> ) {
  const excludedRoutes = [
    '/api/v1/jellyfin/authenticate',
    '/api/v1/jellyfin/status',
    '/api/v1/jellyfin/watch',
    '/api/v1/status'
  ];

  if ( excludedRoutes.includes( ctx.request.url.pathname ) ) {
    await next();
    return;
  }

  const token = ctx.request.headers.get('Authorization')?.split(' ')[1];
  if ( !token || token === 'null' ) {
    ctx.response.status = 401;
    ctx.response.body = {
      message: 'Unauthorized (no token)'
    }

    return;
  }

  try {
    const secret = Deno.env.get('JWT_SECRET');

    // Check if secret is set on the backend
    if ( !secret ) {
      ctx.response.status = 500;
      ctx.response.body = {
        message: 'Internal Server Error'
      }

      console.warn('JWT_SECRET might not be set in environment!');

      return;
    }

    // Verify the JWT signature and expiry
    const encodedSecret = new TextEncoder().encode( secret );
    await jose.jwtVerify( token, encodedSecret );

    await next();
  }
  catch ( error ) {
    ctx.response.status = 401;
    ctx.response.body = {
      message: 'Invalid token.'
    }

    console.error( 'Invalid token:', error );
  }
}
