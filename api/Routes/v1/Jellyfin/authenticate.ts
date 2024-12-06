import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts'
import { Router, RouterContext } from '@oak/oak/router';

import { JellyfinAuthenticateRequest } from "../../../Types/API_ObjectTypes.ts";
import { generateRandomString } from "../../../Utilities/Generators.ts";
import { DBHandler } from "../../../Utilities/DBHandler.ts";

const router = new Router;

let Mongo: DBHandler;

router.post('/authenticate', async (ctx: RouterContext<string>) => {
  Mongo = ctx.state.Mongo;

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

  // Map user ID to DB
  console.log( `[Jellyfin] Mapping user...` );
  try {
    const uid: string = data.User.Id;
    const userRes = await Mongo.selectOneByFilter( 'UserMap', { jfId: uid } );

    if ( !userRes ) {
      // Insert user
      await Mongo.insertOne( 'UserMap', {
        jfId: uid,
        name: data.User.Name,
        lastLogin: new Date().toISOString()
      });
    }
    else if ( !userRes.jfId ) {
      // Update user
      await Mongo.updateOne( 'UserMap', { jfId: uid }, { $set: { jfId: uid, lastLogin: new Date().toISOString() } });
    }
    else {
      // Update last login
      await Mongo.updateOne( 'UserMap', { jfId: uid }, { $set: { lastLogin: new Date().toISOString() } });
    }
  }
  catch (e) {
    console.error( `[Jellyfin] Error mapping user: ${ e }` );
    return {
      status: 500,
      message: 'Internal Server Error'
    }
  }

  // Generate JWT here
  const secret = Deno.env.get('JWT_SECRET') || generateRandomString();
  const jwtToken = await new jose.SignJWT({
    User: data.User.Name,
    AccessToken: data.AccessToken,
    ID: data.User.Id
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1w')
    .sign( new TextEncoder().encode( secret ) );

  return {
    status: 200,
    message: 'User authenticated',
    data: jwtToken
  }
}

export default {
  name: 'Authenticate',
  router: router
};