import * as jose from 'jose'
import { Router, RouterContext } from '@oak/oak';

import { JellyfinAuthenticateRequest } from "../../../Types/API_ObjectTypes.ts";
import { DBHandler } from "../../../Utilities/DBHandler.ts";
import {
  DB_UserSettingRecord,
  NewUserRes,
  UpdatedUserRes
} from "../../../../frontend/src/app/customTypes.ts";

const router = new Router;

let Mongo: DBHandler;

router.post('/authenticate', async (ctx: RouterContext<string>) => {
  Mongo = ctx.state.Mongo;

  const reqBody = await ctx.request.body.json();

  const result = await sendLoginRequest( reqBody.user, reqBody.pass );

  // Set httpOnly cookie when authentication succeeds
  // Note: Set-Cookie is built manually because Oak's SecureCookieMap checks the
  // raw transport, not X-Forwarded-Proto, so it throws behind a TLS-terminating
  // reverse proxy (e.g. Traefik) even with app.proxy=true.
  if ( result.status === 200 && result.data ) {
    const proto = ctx.request.headers.get('x-forwarded-proto') || ctx.request.url.protocol;
    const host = ctx.request.url.hostname;
    const isSecure = proto === 'https' || proto === 'https:' || (host !== 'localhost' && host !== '127.0.0.1');

    let cookie = `pldyn-auth=${result.data}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`;
    if ( isSecure ) cookie += '; Secure';
    ctx.response.headers.append('Set-Cookie', cookie);
  }

  ctx.response.status = result.status;
  ctx.response.body = {
    status: result.status,
    message: result.message,
    ...(result.username ? { username: result.username } : {})
  };
});

async function sendLoginRequest( user: string, pass: string ): Promise<JellyfinAuthenticateRequest> {
  console.log( '[Jellyfin] Processing authentication request' );

  const jellyfinHost = Deno.env.get('JELLYFIN_HOST') || 'http://localhost:8096';

  // Refuse to send credentials over plaintext HTTP to a remote host
  const jellyfinUrl = new URL( jellyfinHost );
  const isLocalhost = jellyfinUrl.hostname === 'localhost' || jellyfinUrl.hostname === '127.0.0.1';
  if ( jellyfinUrl.protocol === 'http:' && !isLocalhost ) {
    console.error( '[Jellyfin] Refusing to authenticate: JELLYFIN_HOST uses plaintext HTTP to a remote host. Use HTTPS.' );
    return { status: 500, message: 'Internal Server Error' };
  }

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
    console.error( '[Jellyfin] Authentication failed: unauthorized' );
    return {
      status: 401,
      message: 'User Unauthorized'
    }
  }

  if ( !response.ok ) {
    console.error( '[Jellyfin] Authentication failed: unexpected error' );
    return {
      status: 500,
      message: 'Internal Server Error'
    }
  }

  const data = await response.json();

  // Map user ID to DB
  console.log( '[Jellyfin] Mapping user...' );
  try {
    const uid: string = data.User.Id;
    const userRes = await Mongo.selectOneByFilter( 'UserMap', { jfId: uid } );

    if ( !userRes ) {
      // Insert user
      const res = await addNewUser( uid, data.User.Name );

      if ( !res || res.inserted < 3 || !res.success ) {
        throw new Error('Error inserting user');
      }
    }
    else {
      // Update last login
      const res = await updateUser( uid );

      if ( !res || !res.success ) {
        throw new Error('Error updating user');
      }
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
  const secret = Deno.env.get('JWT_SECRET');
  if ( !secret ) {
    console.error('[Jellyfin] JWT_SECRET not set — cannot sign tokens.');
    return { status: 500, message: 'Internal Server Error' };
  }
  const jwtToken = await new jose.SignJWT({
    User: data.User.Name,
    AccessToken: data.AccessToken,
    ID: data.User.Id
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign( new TextEncoder().encode( secret ) );

  return {
    status: 200,
    message: 'User authenticated',
    data: jwtToken,
    username: data.User.Name
  }
}

async function addNewUser( jfId: string, name: string ): Promise<NewUserRes> {
  await Mongo.insertOne( 'UserMap', {
    jfId: jfId,
    name: name,
    lastLogin: new Date().toISOString()
  });

  await Mongo.insertOne( 'UserSettings', {
    jfId: jfId,
    clientSettings: {
      lastUsedEditor: 'Music'
    }
  } as DB_UserSettingRecord );

  await Mongo.insertOne( 'UserContributions', {
    jfId: jfId,
    contributions: []
  });

  return { inserted: 3, success: true } as NewUserRes;
}

async function updateUser( jfId: string ): Promise<UpdatedUserRes> {
  await Mongo.updateOne( 'UserMap', { jfId: jfId }, { $set: { lastLogin: new Date().toISOString() } });

  return {
    modified: 1,
    success: true
  } as UpdatedUserRes;
}

export default {
  name: 'Authenticate',
  router: router
};
