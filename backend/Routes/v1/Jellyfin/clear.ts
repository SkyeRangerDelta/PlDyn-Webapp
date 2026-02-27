import { Router } from '@oak/oak';

import { DeleteResponse } from "../../../Types/API_ObjectTypes.ts";
import { isSafeFileName } from "../../../Utilities/IOUtilities.ts";

const router = new Router;

router.post('/clear', async ( ctx ) => {
  if ( !ctx.request.hasBody || ctx.request.body.type() !== 'json' ) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: 'Invalid request type.',
      status: 500,
      error: true
    } as DeleteResponse;

    console.log( 'Invalid request type' );
    return;
  }

  const reqBody = await ctx.request.body.json();

  // Clear the resource specified in the request
  const fileName = reqBody.fileName;

  // Validate filename: reject directory separators to prevent path traversal
  if ( !isSafeFileName( fileName ) ) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: 'Invalid filename.',
      status: 400,
      error: true
    } as DeleteResponse;

    return;
  }

  console.debug( 'Attempting to delete: ' + fileName );

  const tempPath = new URL( `file://${ Deno.cwd() }/temp/audio-uploads/${fileName}` );

  try {
    const stat = Deno.statSync( tempPath );

    if ( !stat.isFile ) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: 'Target is not a file.',
        status: 400,
        error: true
      } as DeleteResponse;

      return;
    }

    Deno.removeSync( tempPath );
  }
  catch {
    ctx.response.status = 500;
    ctx.response.body = {
      message: 'Error removing temp file.',
      status: 500,
      error: true
    } as DeleteResponse;

    return;
  }

  ctx.response.status = 200;
  ctx.response.body = {
    message: 'Success',
    status: 200,
    error: false
  } as DeleteResponse;
});

export default {
  name: 'Clear',
  router: router
};
