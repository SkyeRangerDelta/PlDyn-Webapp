/**
 * Utilities for IO operations
 */

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
      const entryPath = new URL( `${tempPath}/${entry.name}` );

      try {
        Deno.removeSync( entryPath, { recursive: true } );

        console.log( 'Removed temp file:', entry.name );
      }
      catch {
        console.error( 'Error removing temp file:', entryPath );
      }
    }
  } catch (e) {
    console.error( 'Error reading temp folder:', tempPath, e );
  }
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
