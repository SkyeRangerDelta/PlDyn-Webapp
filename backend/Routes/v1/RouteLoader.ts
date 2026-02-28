// backend/Routes/v1/loadRoutes.ts
import { Router } from '@oak/oak';

async function loadRoutes( router: Router, directory: string) {
  console.log( `Loading routes from ${ directory }` );

  const routesPath = `./Routes/v1/`;
  const importPath = `${routesPath}${directory}`;

  for await (const dirEntry of Deno.readDirSync(importPath)) {
    if (dirEntry.isFile && dirEntry.name.endsWith('.ts')) {
      try {
        const modulePath = `./${directory}/${dirEntry.name}`;
        const module = await import( modulePath );

        router.use( module.default.router.routes(), module.default.router.allowedMethods() );
      }
      catch (e) {
        console.error( `Error loading ${ dirEntry.name }\n`, e );
      }
    }
  }
}

export async function getRouter( directory: string ) {
  const router = new Router();

  await loadRoutes( router, directory );
  return router;
}