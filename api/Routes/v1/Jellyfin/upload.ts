import { Router } from '@oak/oak/router';
import { parseFile, selectCover } from "npm:music-metadata@10.7.0";

import { ensureFolderExists } from "../../../Utilities/IOUtilities.ts";
import { AudioFile, AudioUploadResponse } from "../../../Types/API_ObjectTypes.ts";
import { buildImgB64 } from "../../../Utilities/Formatters.ts";

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
  const uploadedFileNames: string[] = [];
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

      uploadedFileNames.push( file.name );
    }
  }

  // Read the metadata from titles in the directory
  const readTracks: AudioFile[] = [];
  const strPath = `${ Deno.cwd() }/temp/audio-uploads`;
  const tempPath = new URL( `file://${Deno.cwd()}/temp/audio-uploads` );
  const tempFolder = Deno.readDirSync( tempPath );
  for ( const entry of tempFolder ) {
    if ( !uploadedFileNames.includes( entry.name ) ) continue;

    const entryPath = `${strPath}/${entry.name}`;

    try {
      const metadata = await parseFile( entryPath );

      const coverData = selectCover( metadata.common.picture ) || {
        format: null,
        data: null
      };

      try {
        const builtMetadata = {
          filePath: entryPath,
          fileName: entry.name,
          title: metadata.common.title || '',
          artist: metadata.common.artist || '',
          album: metadata.common.album || '',
          genre: metadata.common.genre || [],
          year: metadata.common.year || 0,
          track: metadata.common.track.no || 0,
          albumArtist: metadata.common.albumartist || '',
          composer: metadata.common.composer || [],
          discNumber: metadata.common.disk.no || 0,
          cover: {
            format: coverData.format ? coverData.format : null,
            data: coverData.data ? buildImgB64( coverData.data, coverData.format ) : null
          }
        } as AudioFile;

        readTracks.push( builtMetadata );
      }
      catch {
        console.error( 'Error reading metadata:', entryPath );
      }
    }
    catch ( e ) {
      console.error( 'Error reading metadata:', entryPath, e );
    }
  }

  if ( readTracks.length === 0 ) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: 'Error reading metadata',
      status: 500,
      error: true,
      uploadData: []
    } as AudioUploadResponse;
  }

  ctx.response.status = 200;
  ctx.response.body = {
    message: 'Success',
    status: 200,
    error: false,
    uploadData: readTracks
  } as AudioUploadResponse;
});

export default {
  name: 'Upload',
  router: router
};
