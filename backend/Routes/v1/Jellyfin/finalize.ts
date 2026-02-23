import { Router } from '@oak/oak/router';

import { ensureFolderExists, checkFfmpegAvailable } from "../../../Utilities/IOUtilities.ts";
import { writeMetadataToFile } from "../../../Utilities/MetadataWriter.ts";
import { AudioFile, FinalizeUploadResponse, FileProcessingError } from "../../../Types/API_ObjectTypes.ts";

const router = new Router();

router.post('/finalize', async (ctx) => {
  // Validate request has JSON body
  if (!ctx.request.hasBody || ctx.request.body.type() !== 'json') {
    ctx.response.status = 400;
    ctx.response.body = {
      status: 400,
      message: 'Invalid request - expected JSON body',
      error: true,
      processedCount: 0,
      failedFiles: []
    } as FinalizeUploadResponse;
    return;
  }

  // Parse request body
  const body = await ctx.request.body.json();
  const songs: AudioFile[] = body.songs;

  if (!songs || !Array.isArray(songs) || songs.length === 0) {
    ctx.response.status = 400;
    ctx.response.body = {
      status: 400,
      message: 'Invalid request - songs array required',
      error: true,
      processedCount: 0,
      failedFiles: []
    } as FinalizeUploadResponse;
    return;
  }

  // Pre-processing: Check if ffmpeg is available
  const ffmpegAvailable = await checkFfmpegAvailable();
  if (!ffmpegAvailable) {
    ctx.response.status = 500;
    ctx.response.body = {
      status: 500,
      message: 'ffmpeg not found. Please install ffmpeg to process audio files.',
      error: true,
      processedCount: 0,
      failedFiles: []
    } as FinalizeUploadResponse;
    return;
  }

  // Pre-processing: Ensure library directory exists
  try {
    ensureFolderExists(Deno.cwd() + '/library', 'music');
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      status: 500,
      message: `Failed to create library directory: ${error.message}`,
      error: true,
      processedCount: 0,
      failedFiles: []
    } as FinalizeUploadResponse;
    return;
  }

  // Normalize songs data - convert string genre/composer to arrays
  const normalizedSongs = songs.map(song => ({
    ...song,
    genre: Array.isArray(song.genre)
      ? song.genre
      : typeof song.genre === 'string'
        ? song.genre.split(',').map(g => g.trim()).filter(g => g.length > 0)
        : [],
    composer: Array.isArray(song.composer)
      ? song.composer
      : typeof song.composer === 'string'
        ? song.composer.split(',').map(c => c.trim()).filter(c => c.length > 0)
        : []
  }));

  // Process each song
  const tempDir = `${Deno.cwd()}/temp/audio-uploads`;
  const libraryDir = `${Deno.cwd()}/library/music`;
  const failedFiles: FileProcessingError[] = [];
  let processedCount = 0;

  for (const song of normalizedSongs) {
    try {
      await writeMetadataToFile(song, tempDir, libraryDir);
      processedCount++;
      console.log(`Processed ${processedCount}/${normalizedSongs.length}: ${song.fileName}`);
    } catch (error) {
      console.error(`Failed to process ${song.fileName}:`, error.message);

      // Determine error type
      let errorType: 'metadata_write' | 'file_move' | 'ffmpeg_not_found' = 'metadata_write';
      if (error.message.includes('ffmpeg')) {
        errorType = 'metadata_write';
      } else if (error.message.includes('move') || error.message.includes('rename')) {
        errorType = 'file_move';
      }

      failedFiles.push({
        fileName: song.fileName,
        errorType: errorType,
        errorMessage: error.message
      });
    }
  }

  // Determine response status and message
  if (processedCount === 0) {
    // Complete failure
    ctx.response.status = 500;
    ctx.response.body = {
      status: 500,
      message: 'All files failed to process',
      error: true,
      processedCount: 0,
      failedFiles
    } as FinalizeUploadResponse;
  } else if (failedFiles.length > 0) {
    // Partial success
    ctx.response.status = 207;
    ctx.response.body = {
      status: 207,
      message: `Processed ${processedCount}/${normalizedSongs.length} files successfully`,
      error: false,
      processedCount,
      failedFiles
    } as FinalizeUploadResponse;
  } else {
    // Complete success
    ctx.response.status = 200;
    ctx.response.body = {
      status: 200,
      message: `All ${processedCount} files processed successfully`,
      error: false,
      processedCount,
      failedFiles: []
    } as FinalizeUploadResponse;
  }
});

export default {
  name: 'Finalize',
  router: router
};
