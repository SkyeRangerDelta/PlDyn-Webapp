import { Router, RouterContext } from 'https://deno.land/x/oak/mod.ts';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts'

const router = new Router();

router
  .post('/GetTokenData', async ( ctx: RouterContext<string> ) => {

    const token = ctx.request.headers.get('authorization')?.split(' ')[1];
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
      ctx.response.status = 400;
      ctx.response.body = {
        message: `Something's not gone right.\n${ decodeErr }`
      }
    }
  });

export default {
  name: 'GetTokenData',
  router: router
};
