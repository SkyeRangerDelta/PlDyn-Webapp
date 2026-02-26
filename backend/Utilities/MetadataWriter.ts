/**
 * Utilities for writing audio file metadata using ffmpeg
 */

import { AudioFile } from "../Types/API_ObjectTypes.ts";

/**
 * Strip characters that are invalid in Windows and Unix path components,
 * collapse repeated whitespace, and trim trailing dots/spaces.
 */
function sanitizePathComponent(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
}

/**
 * Write cover art image to temporary file
 * @param cover - Cover art object with format and base64 data
 * @param tempDir - Temporary directory path
 * @returns Path to the written cover art file
 */
export async function writeCoverArt(
  cover: { format: string | null; data: string | null },
  tempDir: string
): Promise<string> {
  if (!cover.data || !cover.format) {
    throw new Error('No cover art data provided');
  }

  // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
  const base64Data = cover.data.includes(',') ? cover.data.split(',')[1] : cover.data;

  // Decode base64 to binary data
  const binaryString = atob(base64Data);
  const imageData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    imageData[i] = binaryString.charCodeAt(i);
  }

  // Determine file extension from MIME type
  const ext = cover.format.split('/')[1] || 'jpg'; // e.g., 'image/jpeg' -> 'jpeg'
  const coverFileName = `cover_${Date.now()}.${ext}`;
  const coverPath = `${tempDir}/${coverFileName}`;

  Deno.writeFileSync(coverPath, imageData);

  return coverPath;
}

/**
 * Build ffmpeg command arguments for writing metadata
 * @param song - Audio file with metadata
 * @param inputPath - Input file path
 * @param outputPath - Output file path
 * @param coverPath - Cover art image path
 * @returns Array of ffmpeg command arguments
 */
export function buildFfmpegCommand(
  song: AudioFile,
  inputPath: string,
  outputPath: string,
  coverPath: string
): string[] {
  // Determine file format from extension
  const fileExt = song.fileName.split('.').pop()?.toLowerCase() || 'mp3';

  // Genre and composer should already be normalized to arrays
  const genreValue = song.genre.join(';');
  const composerValue = song.composer.join(';');

  const args: string[] = [
    '-i', inputPath,
    '-i', coverPath,
    '-metadata', `title=${song.title}`,
    '-metadata', `artist=${song.artist}`,
    '-metadata', `album=${song.album}`,
    '-metadata', `genre=${genreValue}`,
    '-metadata', `date=${song.year}`,
    '-metadata', `album_artist=${song.albumArtist}`,
    '-metadata', `composer=${composerValue}`
  ];

  // Format-specific metadata
  if (fileExt === 'mp3') {
    args.push(
      '-metadata', `track=${song.track}`,
      '-metadata', `disc=${song.discNumber}`,
      '-id3v2_version', '3'
    );
  } else if (fileExt === 'flac') {
    args.push(
      '-metadata', `tracknumber=${song.track}`,
      '-metadata', `discnumber=${song.discNumber}`
    );
  } else {
    // Default for other formats (wav, etc.)
    args.push(
      '-metadata', `track=${song.track}`,
      '-metadata', `disc=${song.discNumber}`
    );
  }

  // Add cover art and copy codecs (no re-encoding)
  args.push(
    '-map', '0:a',      // Map audio from first input
    '-map', '1:0',      // Map cover art from second input
    '-c:a', 'copy',     // Copy audio codec (no re-encoding)
    '-c:v', 'copy',     // Copy video/image codec (no re-encoding)
    '-metadata:s:v', 'title=Album cover',
    '-metadata:s:v', 'comment=Cover (front)',
    '-y',               // Overwrite output file without asking
    outputPath
  );

  return args;
}

/**
 * Write metadata to audio file and move it to library.
 *
 * Output structure:
 *   libraryDir/<AlbumArtist>/<Album> (<Year>)/<Track>. <Title>.<ext>
 */
export async function writeMetadataToFile(
  song: AudioFile,
  tempDir: string,
  libraryDir: string
): Promise<void> {
  // 1. Write cover art to temporary file
  const coverPath = await writeCoverArt(song.cover, tempDir);

  // 2. Build destination directory: Artist / Album (Year)
  const ext = song.fileName.split('.').pop()?.toLowerCase() || 'mp3';
  const artistDir = `${libraryDir}/${sanitizePathComponent(song.albumArtist || song.artist)}`;
  const albumDir  = `${artistDir}/${sanitizePathComponent(song.album)} (${song.year})`;

  try {
    Deno.mkdirSync(albumDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw new Error(`Failed to create directory structure: ${(error as Error).message}`);
    }
  }

  // 3. Build output filename: "01. Title.ext"
  const trackNum = String(song.track).padStart(2, '0');
  const outputFileName = `${trackNum}. ${sanitizePathComponent(song.title)}.${ext}`;
  const finalOutputPath = `${albumDir}/${outputFileName}`;

  // 4. Define temp paths
  const inputPath = `${tempDir}/${song.fileName}`;
  const tempOutputPath = `${tempDir}/processed_${song.fileName}`;

  // 5. Build and execute ffmpeg command
  const ffmpegArgs = buildFfmpegCommand(song, inputPath, tempOutputPath, coverPath);

  try {
    const command = new Deno.Command('ffmpeg', {
      args: ffmpegArgs,
      stdout: 'piped',
      stderr: 'piped'
    });

    const { code, stderr } = await command.output();

    if (code !== 0) {
      const errorMessage = new TextDecoder().decode(stderr);
      throw new Error(`ffmpeg failed: ${errorMessage}`);
    }
  } catch (error) {
    try { Deno.removeSync(coverPath); } catch { /* ignore */ }
    throw error;
  }

  // 6. Move processed file to library (fall back to copy+delete across device boundaries)
  try {
    Deno.renameSync(tempOutputPath, finalOutputPath);
  } catch (renameError) {
    const msg = (renameError as Error).message ?? '';
    if (msg.includes('os error 18') || msg.toLowerCase().includes('cross-device')) {
      try {
        Deno.copyFileSync(tempOutputPath, finalOutputPath);
        Deno.removeSync(tempOutputPath);
      } catch (copyError) {
        throw new Error(`Failed to move file to library: ${(copyError as Error).message}`);
      }
    } else {
      throw new Error(`Failed to move file to library: ${msg}`);
    }
  }

  // 7. Clean up temporary files
  try { Deno.removeSync(inputPath); } catch (error) {
    console.warn(`Failed to remove temp input file: ${(error as Error).message}`);
  }
  try { Deno.removeSync(coverPath); } catch (error) {
    console.warn(`Failed to remove temp cover file: ${(error as Error).message}`);
  }

  console.log(`Successfully processed: ${artistDir.split('/').pop()}/${albumDir.split('/').pop()}/${outputFileName}`);
}
