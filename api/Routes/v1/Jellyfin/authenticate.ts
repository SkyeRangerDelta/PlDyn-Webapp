import { Router, RouterContext } from '@oak/oak/router';
import { JellyfinAuthenticateRequest } from "../../../Types/API_ObjectTypes.ts";

const router = new Router;

router.post('/authenticate', async (ctx: RouterContext<string>) => {
  const reqBody = await ctx.request.body.json();

  const result = await sendLoginRequest( reqBody.user, reqBody.pass );

  ctx.response.status = result.status;
  ctx.response.body = result;
});

async function sendLoginRequest( user: string, pass: string ): Promise<JellyfinAuthenticateRequest> {
  console.log( `[Jellyfin] Authenticating user ${ user }` );

  const jellyfinHost = Deno.env.get('JELLYFIN_HOST') || 'http://localhost:8096';
  const url = `${ jellyfinHost }/Users/AuthenticateByName`;

  const response = await fetch( url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': `MediaBrowser Client="PlDyn-Webapp", Device="${ Deno.hostname() }", DeviceId="${ Deno.hostname() }", Version="1.0"`
      },
    body: JSON.stringify({
      Username: user,
      Pw: pass
    })
  });

  if ( response.status === 401 ) {
    console.error( `[Jellyfin] Unauthorized user ${ user }` );
    return {
      status: 401,
      message: 'User Unauthorized'
    }
  }

  if ( !response.ok ) {
    console.error( `[Jellyfin] Error authenticating user ${ user }` );
    return {
      status: 500,
      message: 'Internal Server Error'
    }
  }

  const data = await response.json();

  return {
    status: 200,
    message: 'User authenticated',
    data: data
  }
}

export default {
  name: 'Authenticate',
  router: router
};