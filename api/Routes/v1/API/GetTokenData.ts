import { Router, RouterContext } from '@oak/oak/router';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts'

const router = new Router();

router
  .post('/gettokendata', async ( ctx: RouterContext<string> ) => {

    const token = ctx.request.headers.get('authorization')?.split(' ')[1];
    const secret = Deno.env.get('JWT_SECRET');
    const requestBody = await ctx.request.body.json();
    const requestedParams = requestBody.params;

    if ( !token ) {
      ctx.response.status = 401;
      ctx.response.body = {
        message: 'Unauthorized'
      }

      return;
    }

    if ( !secret ) {
      ctx.response.status = 500;
      ctx.response.body = {
        message: 'Internal Server Error'
      }

      console.warn('JWT_SECRET might not be set in environment!');

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
      const { payload } = await jose.jwtVerify( token, new TextEncoder().encode( secret ) );

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
  name: 'Status',
  router: router
};