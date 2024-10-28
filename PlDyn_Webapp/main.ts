// Boots the Webapp

// Imports
import { load } from '@std/dotenv';

export async function start() {
  // Vars
  await load( { export: true } );

  const port = parseInt(Deno.env.get('APP_PORT') || '4200');
  const host = Deno.env.get('APP_HOST') || 'localhost';

  console.log( `Starting server on ${host}:${port}` );

  Deno.serve( { port: port, hostname: host }, reqHandler );
}

function reqHandler( req: Request ) {
  const url = new URL( req.url );

  console.log( `Request received: ${url.pathname}` );

  return new Response( 'Hello World!', { status: 200 } );
}

await start();
