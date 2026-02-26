// Boots the backend

// Imports
import { load } from '@std/dotenv';
import { Application, HttpServerNative } from '@oak/oak';
import { join } from '@std/path';

import { MainRouter } from "./Routes/MainRouter.ts";
import { generateRandomString } from "./Utilities/Generators.ts";
import { DBHandler } from "./Utilities/DBHandler.ts";
import { cleanTempFolders, startTempCleanupScheduler } from "./Utilities/IOUtilities.ts";

// Env
await load( { export: true } );

// Validate required environment variables
const REQUIRED_ENV_VARS = ['MONGO_URI', 'MONGO_DB_NAME'];
const missingVars = REQUIRED_ENV_VARS.filter(v => !Deno.env.get(v));
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Copy backend/.env.example to backend/.env and fill in the values.');
  Deno.exit(1);
}

// Globals
// Force Oak to use native Deno HTTP server instead of Node.js adapter
const app = new Application({
  serverConstructor: HttpServerNative
});

const port = parseInt( Deno.env.get('APP_PORT') || '4200' );
const host = Deno.env.get('APP_HOST') || 'localhost';

// Configure RDS
const Mongo = new DBHandler();

// Ready I/O
cleanTempFolders();
startTempCleanupScheduler();

// Check write access to library directory
try {
  const canary = `${Deno.cwd()}/library/music/.write-test`;
  Deno.writeTextFileSync(canary, '');
  Deno.removeSync(canary);
  console.log('Write access to library/music: OK');
} catch {
  console.warn('%c⚠ WARNING: No write access to library/music — uploaded audio will not be saved', 'color: yellow; font-weight: bold');
}

// Check ffmpeg availability
try {
  const ffmpeg = new Deno.Command('ffmpeg', { args: ['-version'], stdout: 'piped', stderr: 'piped' });
  const { stdout, stderr } = await ffmpeg.output();
  const decoded = new TextDecoder().decode(stdout) || new TextDecoder().decode(stderr);
  const firstLine = decoded.split('\n')[0];
  console.log(`ffmpeg detected: ${firstLine}`);
} catch {
  console.warn('%c⚠ WARNING: ffmpeg not found on PATH — audio processing will fail', 'color: yellow; font-weight: bold');
}

// Check JWT token
let jwtSecret = Deno.env.get('JWT_SECRET');
if ( !jwtSecret ) {
  console.error('JWT_SECRET not set in environment; creating one.');
  jwtSecret = generateRandomString();
  Deno.env.set('JWT_SECRET', jwtSecret);
  await Deno.writeTextFile( '.env', `\nJWT_SECRET=${ jwtSecret }\n`, { append: true } );
}

// Attach Mongo to CTX
app.use( async (ctx, next) => {
  ctx.state.Mongo = Mongo;
  await next();
});

// Log requests
app.use( async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
} );

// Set Routes
app.use( MainRouter.routes(), MainRouter.allowedMethods() );

app.use( async (ctx, next) => {
  const indexPath = join( Deno.cwd(), 'frontend/dist/frontend/browser' );

  try {
    await ctx.send({
      root: indexPath,
      index: 'index.html',
    });
  }
  catch {
    await next();
  }
} );

// Error handler
app.use( async ctx => {
  ctx.response.status = 404;
  ctx.response.body = `${ctx.request.url} not found`;
} )

// Start
console.log(`Server running on http://${host}:${port}`);
await app.listen({ port, hostname: host });
