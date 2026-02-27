import { Router, RouterContext } from '@oak/oak';
import * as jose from 'jose'

const router = new Router();

router
  .post('/GetTokenData', async ( ctx: RouterContext<string> ) => {

    // Read token from cookie first, fallback to Authorization header
    const cookieToken = await ctx.cookies.get('pldyn-auth');
    const headerToken = ctx.request.headers.get('authorization')?.split(' ')[1];
    const token = cookieToken || headerToken;
    const secret = new TextEncoder().encode( Deno.env.get('JWT_SECRET') );
    const requestBody = await ctx.request.body.json();
    const requestedParams = requestBody.params;

    if ( !token || token === 'null' ) {
      ctx.response.status = 401;
      ctx.response.body = {
        message: 'Unauthorized (no token)'
      }

      return;
    }

    if ( !requestBody || !requestedParams || requestedParams.length === 0 ) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: 'Bad Request'
      }

      return;
    }

    // Verify token here
    try {
      const { payload } = await jose.jwtVerify( token, secret );

      ctx.response.body = {
        message: 'Success',
        data: requestedParams.reduce(( acc: Record<string, any>, param: string ) => {
          acc[param] = payload[param];
          return acc;
        }, {})
      };
    }
    catch ( decodeErr ) {
      console.error('[GetTokenData] Token verification failed:', decodeErr);
      ctx.response.status = 400;
      ctx.response.body = {
        message: 'Invalid or expired token.'
      }
    }
  });

export default {
  name: 'GetTokenData',
  router: router
};
