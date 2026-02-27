/**
 * Utilities for IO operations
 */

/**
 * Validate that a filename is safe (no path traversal, no directory separators).
 * Returns `true` if the filename is safe, `false` otherwise.
 */
export function isSafeFileName(name: unknown): name is string {
  if (!name || typeof name !== 'string') return false;
  if (/[\/\\]/.test(name)) return false;           // directory separators
  if (name === '.' || name === '..') return false;  // current/parent directory refs
  return true;
}

/**
 * Ensure a folder exists
 * @param parentPath
 * @param folderName
 */
export function ensureFolderExists( parentPath: string, folderName: string ) {
  const folderPath = new URL( `file://${parentPath}/${folderName}` );

  try {
    Deno.mkdirSync( folderPath, {
      recursive: true
    } );
  }
  catch ( error ) {
    if ( error instanceof Deno.errors.AlreadyExists ) {
      console.log( 'Folder already exists:', folderPath );
    }
    else {
      console.error( 'Error creating folder:', error );
    }
  }
}

/**
 * cleanTempFolder - Cleans and removes excess data from the temp folder
 */
export function cleanTempFolders() {
  const tempPath = new URL( `file://${ Deno.cwd() }/temp/audio-uploads` );

  try {

    let tempFolder;

    try {
      tempFolder = Deno.readDirSync( tempPath );
    }
    catch {
      console.log( 'Temp folder does not exist, creating ', tempPath.href );
      Deno.mkdirSync( tempPath, { recursive: true } );
      return;
    }

    if ( !tempFolder ) {
      console.log( 'Temp folder is empty:', tempPath );
      return;
    }

    for ( const entry of tempFolder ) {
      const entryPath = new URL( `${ tempPath }/${ entry.name }` );

      try {
        Deno.removeSync( entryPath, { recursive: true } );

        console.log( 'Removed temp file:', entry.name );
      } catch {
        console.error( 'Error removing temp file:', entryPath );
      }
    }
  }
  catch {
    console.error( 'Error reading temp folder:', tempPath );
  }
}

const TEMP_FILE_MAX_AGE_MS = 2 * 60 * 60 * 1000;  // 2 hours
const CLEANUP_INTERVAL_MS  = 30 * 60 * 1000;        // 30 minutes

/**
 * Starts a periodic scheduler that removes files from temp/audio-uploads
 * older than 2 hours. Walks per-user subdirectories and removes empty ones.
 * Runs every 30 minutes.
 */
export function startTempCleanupScheduler(): void {
  setInterval(() => {
    const basePath = `${Deno.cwd()}/temp/audio-uploads`;
    const cutoff = Date.now() - TEMP_FILE_MAX_AGE_MS;

    try {
      for (const userDir of Deno.readDirSync(basePath)) {
        if (!userDir.isDirectory) continue;
        const userPath = `${basePath}/${userDir.name}`;

        let remaining = 0;
        try {
          for (const entry of Deno.readDirSync(userPath)) {
            if (!entry.isFile) { remaining++; continue; }
            const filePath = `${userPath}/${entry.name}`;
            try {
              const { mtime } = Deno.statSync(filePath);
              if (mtime && mtime.getTime() < cutoff) {
                Deno.removeSync(filePath);
                console.log(`[TempCleanup] Removed stale file: ${userDir.name}/${entry.name}`);
              } else {
                remaining++;
              }
            } catch { /* file may have been removed concurrently */ }
          }
        } catch { /* directory may have been removed concurrently */ }

        // Remove empty user directories
        if (remaining === 0) {
          try { Deno.removeSync(userPath); } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('[TempCleanup] Error during scheduled cleanup:', error);
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Check if ffmpeg is available in the system PATH
 * @returns Promise<boolean> - true if ffmpeg is available, false otherwise
 */
export async function checkFfmpegAvailable(): Promise<boolean> {
  try {
    const command = new Deno.Command('ffmpeg', {
      args: ['-version'],
      stdout: 'null',
      stderr: 'null'
    });
    const { code } = await command.output();
    return code === 0;
  } catch {
    return false;
  }
}
