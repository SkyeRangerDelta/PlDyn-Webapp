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
  const rootTempPath = `${ Deno.cwd() }/temp`;
  const tempPath = new URL( `file://${ Deno.cwd() }/temp/audio-uploads` );

  let tempFolder;

  try {
    tempFolder = Deno.readDirSync( tempPath );
  } catch (e) {
    ensureFolderExists( rootTempPath, 'audio-uploads' );
  }

  if ( !tempFolder ) {
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
}
