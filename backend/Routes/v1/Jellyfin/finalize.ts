import { Router } from '@oak/oak';

import { DBHandler } from "../../../Utilities/DBHandler.ts";
import { ensureFolderExists, checkFfmpegAvailable } from "../../../Utilities/IOUtilities.ts";
import { writeMetadataToFile } from "../../../Utilities/MetadataWriter.ts";
import { triggerMusicLibraryRefresh, extractJellyfinToken } from "../../../Utilities/JellyfinLibrary.ts";
import {
  AudioFile,
  FinalizeUploadResponse,
  FileProcessingError,
  JellyfinContribution,
  RawAudioFile
} from "../../../Types/API_ObjectTypes.ts";

const router = new Router();

router.post('/finalize', async (ctx) => {
  const userId = ctx.state.userId as string | undefined;
  if (!userId) {
    ctx.response.status = 401;
    ctx.response.body = {
      status: 401,
      message: 'Missing user identity.',
      error: true,
      processedCount: 0,
      failedFiles: []
    } as FinalizeUploadResponse;
    return;
  }

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
  const songs = body.songs;

  // Normalize songs data - convert string genre/composer to arrays
  const normalizedSongs: AudioFile[] = songs.map((song: RawAudioFile) => ({
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
    console.error('[Finalize] Failed to create library directory:', (error as Error).message);
    ctx.response.status = 500;
    ctx.response.body = {
      status: 500,
      message: 'Failed to prepare library directory.',
      error: true,
      processedCount: 0,
      failedFiles: []
    } as FinalizeUploadResponse;
    return;
  }

  // Process each song
  const tempDir = `${Deno.cwd()}/temp/audio-uploads/${userId}`;
  const libraryDir = `${Deno.cwd()}/library/music`;
  const failedFiles: FileProcessingError[] = [];
  const successfulSongs: AudioFile[] = [];
  let processedCount = 0;

  for (const song of normalizedSongs) {
    try {
      await writeMetadataToFile(song, tempDir, libraryDir);
      processedCount++;
      successfulSongs.push(song);
      console.log(`Processed ${processedCount}/${normalizedSongs.length}: ${song.fileName}`);
    } catch (error) {
      console.error(`Failed to process ${song.fileName}:`, (error as Error).message);

      // Determine error type
      let errorType: 'metadata_write' | 'file_move' | 'ffmpeg_not_found' = 'metadata_write';
      if ((error as Error).message.includes('ffmpeg')) {
        errorType = 'metadata_write';
      } else if ((error as Error).message.includes('move') || (error as Error).message.includes('rename')) {
        errorType = 'file_move';
      }

      failedFiles.push({
        fileName: song.fileName,
        errorType: errorType,
        errorMessage: 'Processing failed.'
      });
    }
  }

  // Record contributions in the database (per-album)
  if (processedCount > 0) {
    try {
      const Mongo: DBHandler = ctx.state.Mongo;

      // Group batch songs by album
      const batchAlbums = new Map<string, { songCount: number; year: number; albumArtist: string; album: string }>();
      for (const song of successfulSongs) {
        const key = `${song.album}::${song.albumArtist}`;
        const existing = batchAlbums.get(key);
        if (existing) {
          existing.songCount++;
        } else {
          batchAlbums.set(key, {
            album: song.album, albumArtist: song.albumArtist, year: song.year,
            songCount: 1,
          });
        }
      }

      // Merge into existing contributions (coverUrl is computed at read time)
      const doc = await Mongo.selectOneByFilter('UserContributions', { jfId: userId });
      const contributions: JellyfinContribution[] = doc?.contributions ?? [];
      const now = new Date().toISOString();

      for (const [, batch] of batchAlbums) {
        const idx = contributions.findIndex(c => c.album === batch.album && c.albumArtist === batch.albumArtist);
        if (idx !== -1) {
          contributions[idx].songCount += batch.songCount;
          contributions[idx].date = now;
        } else {
          contributions.push({ ...batch, coverUrl: null, date: now });
        }
      }

      await Mongo.updateOne('UserContributions', { jfId: userId },
        { $set: { contributions } }, { upsert: true });
    } catch (error) {
      console.error('[Finalize] Failed to record contributions:', (error as Error).message);
    }
  }

  // Trigger Jellyfin library refresh if any files were processed
  if (processedCount > 0) {
    const cookieToken = await ctx.cookies.get('pldyn-auth');
    const headerToken = ctx.request.headers.get('Authorization')?.split(' ')[1];
    const rawToken = cookieToken || headerToken;
    const jellyfinToken = rawToken ? await extractJellyfinToken(rawToken) : undefined;

    if (jellyfinToken) {
      const refresh = await triggerMusicLibraryRefresh(jellyfinToken);
      if (!refresh.triggered) {
        console.warn(`[Jellyfin] Library refresh skipped: ${refresh.reason}`);
      }
    } else {
      console.warn('[Jellyfin] Library refresh skipped: could not extract Jellyfin token from request');
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
