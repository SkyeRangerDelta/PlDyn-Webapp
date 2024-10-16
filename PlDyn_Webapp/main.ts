// Boots the Webapp

// Imports
import { load } from '@std/dotenv';

export function start() {
  // Vars
  load( { export: true } );

  const port = Deno.env.get('APP_PORT') || '4200';
  const host = Deno.env.get('APP_HOST') || 'localhost';

// Start the server
  const cmd = `ng serve --host ${host} --port ${port}`;

  console.info('[INFO]', `Starting server on ${host}:${port}`);
  const webapp = new Deno.Command(
    cmd,
    {
      stdout: "piped",
      stderr: "piped",
    },
  );

  // const { code, stdout, stderr } = webapp.outputSync();
  // console.error(stderr);
  // console.log(stdout);
  // console.log(code);
}

start();
