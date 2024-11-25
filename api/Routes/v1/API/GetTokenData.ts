import { Router, RouterContext } from '@oak/oak/router';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts'

const router = new Router();

router
  .post('/GetTokenData', async ( ctx: RouterContext<string> ) => {

    const token = ctx.request.headers.get('authorization')?.split(' ')[1];
    const secret = Deno.env.get('JWT_SECRET');
    const requestBody = await ctx.request.body.json();
    const requestedParams = requestBody.params;

    if ( !requestBody || !requestedParams || requestedParams.length === 0 ) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: 'Bad Request'
      }

      return;
    }

    // Verify token here
    try {
      const { payload } = await jose.jwtVerify( token!, new TextEncoder().encode( secret ) );

      ctx.response.body = {
        message: 'Success',
        data: requestedParams.reduce(( acc: Record<string, any>, param: string ) => {
          acc[param] = payload[param];
          return acc;
        }, {})
      };
    }
    catch {
      ctx.response.status = 400;
      ctx.response.body = {
        message: `Something's not gone right.`
      }
    }
  });

export default {
  name: 'GetTokenData',
  router: router
};