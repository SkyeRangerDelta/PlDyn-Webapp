import { Router } from '@oak/oak/router';
import { ensureFolderExists } from "../../../Utilities/IOUtilities.ts";

const router = new Router;

router.post('/upload', async (ctx) => {
  if ( !ctx.request.hasBody || ctx.request.body.type() !== 'form-data' ) {
    ctx.response.status = 400;
    ctx.response.body = { message: 'Invalid request' };
    return;
  }

  const formData = await ctx.request.body.formData();

  // Store the file data in a temp folder
  // Ensure the folder exists
  ensureFolderExists( Deno.cwd() + '/temp', 'audio-uploads' );

  // Save the file data to the temp folder
  const files = formData.getAll('files');
  for ( const file of files ) {
    if ( file instanceof File ) {
      const fileData = new Uint8Array( await file.arrayBuffer() );
      const filePath = new URL( `file://${Deno.cwd()}/temp/audio-uploads/${ file.name }` );

      try {
        Deno.writeFileSync( filePath, fileData );
      }
      catch {
        console.error( 'Error writing file:', filePath, file.name );
        ctx.response.status = 500;
        ctx.response.body = { message: 'Error writing file' };
      }
    }
  }

  // Send the file data to Jellyfin server

  ctx.response.status = 200;
  ctx.response.body = { message: 'Done' };
});

export default {
  name: 'Upload',
  router: router
};
