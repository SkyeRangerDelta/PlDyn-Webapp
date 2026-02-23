/**
 * Utilities for writing audio file metadata using ffmpeg
 */

import { AudioFile } from "../Types/API_ObjectTypes.ts";

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

  Deno.writeFileSync(new URL(`file://${coverPath}`), imageData);

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
 * Write metadata to audio file and move it to library
 * @param song - Audio file with metadata
 * @param tempDir - Temporary directory path
 * @param libraryDir - Library directory path
 */
export async function writeMetadataToFile(
  song: AudioFile,
  tempDir: string,
  libraryDir: string
): Promise<void> {
  // 1. Write cover art to temporary file
  const coverPath = await writeCoverArt(song.cover, tempDir);

  // 2. Define file paths
  const inputPath = `${tempDir}/${song.fileName}`;
  const tempOutputPath = `${tempDir}/processed_${song.fileName}`;

  // Handle filename conflicts in library
  let finalOutputPath = `${libraryDir}/${song.fileName}`;
  try {
    const fileExists = Deno.statSync(new URL(`file://${finalOutputPath}`));
    if (fileExists) {
      // File exists, append timestamp
      const timestamp = Date.now();
      const nameParts = song.fileName.split('.');
      const ext = nameParts.pop();
      const baseName = nameParts.join('.');
      finalOutputPath = `${libraryDir}/${baseName}_${timestamp}.${ext}`;
      console.warn(`File conflict: renamed to ${baseName}_${timestamp}.${ext}`);
    }
  } catch {
    // File doesn't exist, continue with original path
  }

  // 3. Build ffmpeg command
  const ffmpegArgs = buildFfmpegCommand(song, inputPath, tempOutputPath, coverPath);

  // 4. Execute ffmpeg
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
    // Clean up cover art before rethrowing
    try {
      Deno.removeSync(new URL(`file://${coverPath}`));
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }

  // 5. Move processed file to library
  try {
    Deno.renameSync(
      new URL(`file://${tempOutputPath}`),
      new URL(`file://${finalOutputPath}`)
    );
  } catch (error) {
    throw new Error(`Failed to move file to library: ${error.message}`);
  }

  // 6. Clean up temporary files
  try {
    Deno.removeSync(new URL(`file://${inputPath}`));
  } catch (error) {
    console.warn(`Failed to remove temp input file: ${error.message}`);
  }

  try {
    Deno.removeSync(new URL(`file://${coverPath}`));
  } catch (error) {
    console.warn(`Failed to remove temp cover file: ${error.message}`);
  }

  console.log(`Successfully processed: ${song.fileName}`);
}
