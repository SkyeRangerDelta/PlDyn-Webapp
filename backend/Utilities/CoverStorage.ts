/**
 * Utilities for resolving album cover art from the music library.
 * Covers are saved as cover.<ext> inside each album directory by MetadataWriter.
 * This module provides lookup and content-type detection for the serving endpoint.
 */

import { sanitizePathComponent } from "./MetadataWriter.ts";

const LIBRARY_DIR = `${Deno.cwd()}/library/music`;

/**
 * Construct the album directory path matching MetadataWriter's output structure.
 */
export function getAlbumDir(albumArtist: string, album: string, year: number): string {
  return `${LIBRARY_DIR}/${sanitizePathComponent(albumArtist)}/${sanitizePathComponent(album)} (${year})`;
}

/**
 * Find the cover file in an album directory.
 * Returns the full path if found, null otherwise.
 */
export function findAlbumCover(albumDir: string): string | null {
  try {
    for (const entry of Deno.readDirSync(albumDir)) {
      if (entry.isFile && entry.name.startsWith('cover.')) {
        return `${albumDir}/${entry.name}`;
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return null;
}

/**
 * Detect the MIME content type from file magic bytes.
 */
export function detectContentType(data: Uint8Array): string {
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) return 'image/jpeg';
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) return 'image/png';
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return 'image/gif';
  if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46) return 'image/webp';
  return 'image/jpeg';
}
