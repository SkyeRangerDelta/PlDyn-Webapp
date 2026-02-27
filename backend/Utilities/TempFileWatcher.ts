/**
 * Watches the temp/audio-uploads directory for file removals
 * and notifies registered listeners (SSE connections).
 */

import { basename, dirname } from '@std/path';

type FileRemovedCallback = (userId: string, fileName: string) => void;

export class TempFileWatcher {
  private listeners = new Set<FileRemovedCallback>();
  private watchPath: string;

  constructor(watchPath: string) {
    this.watchPath = watchPath;
  }

  async start(): Promise<void> {
    console.log(`[TempFileWatcher] Watching ${this.watchPath}`);

    const watcher = Deno.watchFs(this.watchPath);

    for await (const event of watcher) {
      if (event.kind !== 'remove') continue;

      for (const path of event.paths) {
        const fileName = basename(path);
        const userId = basename(dirname(path));

        // Skip intermediate ffmpeg artifacts (never shown in the table)
        if (fileName.startsWith('processed_')) continue;

        console.log(`[TempFileWatcher] File removed: ${userId}/${fileName}`);

        for (const listener of this.listeners) {
          listener(userId, fileName);
        }
      }
    }
  }

  addListener(cb: FileRemovedCallback): () => void {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }
}
