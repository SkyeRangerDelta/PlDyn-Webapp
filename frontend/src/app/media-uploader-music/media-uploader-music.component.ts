import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AudioUploadResponse, DeleteResponse, Song, AlbumGroup } from '../customTypes';

import { MediaService } from '../services/media.service';
import { NotificationService } from '../services/notification.service';
import { CoverSearchDialogComponent } from './cover-search-dialog/cover-search-dialog.component';

@Component({
    selector: 'app-media-uploader-music',
    templateUrl: './media-uploader-music.component.html',
    styleUrls: ['./media-uploader-music.component.scss'],
    standalone: false
})
export class MediaUploaderMusicComponent implements OnInit, OnDestroy {
  musicForm: FormGroup;
  selectedFiles: File[] = [];
  songs: Song[] = [];

  curTrackNumber = 1;

  isLoading = false;

  // Upload progress tracking
  uploadProgress = {
    isUploading: false,
    uploadedCount: 0,
    totalFiles: 0,
    currentFileProgress: 0,
    hasUploaded: false  // Track if any uploads have occurred
  };

  private watchSub?: Subscription;
  private finalizingFiles = new Set<string>();
  private readonly clickHandler = () => this.cleanupMenus();

  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  constructor(
    private fb: FormBuilder,
    private mediaService: MediaService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    // Auth check now handled by AuthGuard on the route

    this.musicForm = this.fb.group({
      title: ['', Validators.required],
      artist: ['', Validators.required],
      album: ['', Validators.required],
      genre: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      track: [this.curTrackNumber, Validators.required],
      albumArtist: ['', Validators.required],
      composer: [''],
      discNumber: [1, Validators.required],
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    document.addEventListener( 'click', this.clickHandler );

    // Watch for temp file removals via SSE
    this.watchSub = this.mediaService.watchTempFiles().subscribe(fileName => {
      // Ignore removals for files currently being finalized — finalize deletes
      // temp files as part of normal processing, not because they expired.
      if (this.finalizingFiles.delete(fileName)) return;

      const index = this.songs.findIndex(s => s.fileName === fileName);
      if (index === -1) return; // Already removed

      const song = this.songs[index];
      this.songs.splice(index, 1);
      this.uploadProgress.uploadedCount--;
      this.uploadProgress.totalFiles--;

      if (this.uploadProgress.totalFiles <= 0) {
        this.resetUploadProgress();
      }

      this.notificationService.showError(`${song.title || fileName} was removed (temp file expired).`);
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener( 'click', this.clickHandler );
    this.watchSub?.unsubscribe();
  }

  cleanupMenus(): void {
    // MatMenu handles its own lifecycle; kept for document click handler cleanup
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      console.log('No files selected');
      return;
    }

    this.isLoading = true;
    this.selectedFiles = Array.from( input.files );

    this.uploadSongs();
  }

  async uploadSongs() {
    // Safety check: prevent upload if no files selected
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      console.warn('Upload attempted with no files selected');
      this.isLoading = false;
      this.notificationService.showError('No files selected for upload.');
      return;
    }

    // Initialize progress tracking for this batch
    const newFilesCount = this.selectedFiles.length;
    const startingCount = this.uploadProgress.uploadedCount;

    this.uploadProgress.isUploading = true;
    this.uploadProgress.totalFiles = startingCount + newFilesCount;
    this.uploadProgress.currentFileProgress = 0;
    this.uploadProgress.hasUploaded = true;

    // Upload files sequentially
    // Store length to avoid issues if array gets modified
    const totalFiles = newFilesCount;
    const filesToUpload = [...this.selectedFiles]; // Create a copy

    for (let i = 0; i < totalFiles; i++) {
      const file = filesToUpload[i];

      this.uploadProgress.currentFileProgress = 0;

      try {
        await this.uploadSingleFile(file);
        this.uploadProgress.uploadedCount++;
      } catch (error: any) {
        console.error(`Error uploading ${file.name}:`, error);
        this.notificationService.showError(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
        // Continue with next file instead of stopping
      }
    }

    // Mark uploading as complete but keep the progress visible
    this.uploadProgress.isUploading = false;
    this.uploadProgress.currentFileProgress = 0;
    this.isLoading = false;
  }

  private uploadSingleFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mediaService.uploadSingleFile(file).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            // Update upload progress
            if (event.total) {
              this.uploadProgress.currentFileProgress = Math.round((100 * event.loaded) / event.total);
            }
          } else if (event.type === HttpEventType.Response) {
            // File upload complete, process response
            const data = event.body as AudioUploadResponse;

            if (!data.error && data.uploadData && data.uploadData.length > 0) {
              // Add the uploaded song to the table
              this.addSongsToTable(data.uploadData);
              resolve();
            } else {
              console.error('Error in response data:', data.message, data.status);
              this.notificationService.showError(data.message);
              reject(new Error(data.message));
            }
          }
        },
        error: (error) => {
          console.error('HTTP error during upload:', error);
          // Note: Auth errors (401) are now handled by AuthInterceptor
          this.notificationService.showError(error.message || 'Internal server error');
          reject(error);
        }
      });
    });
  }

  addSongsToTable( songData: Song[] ): void {
    songData.forEach( song => {
      if ( song.discNumber === 0 ) song.discNumber = 1;
      if ( !this.songs.includes( song ) ) {
        this.songs.push( song );
      }
    } );

    this.isLoading = false;
    this.selectedFiles = [];
  }

  removeSong( song: Song ): void {
    const index = this.songs.indexOf( song );
    this.songs.splice( index, 1 );

    this.mediaService.clearMedia( song.fileName ).subscribe({
      next: (data: DeleteResponse) => {
        if ( data.error ) {
          console.error( 'Error deleting media:', data.message, data.status );
          this.notificationService.showError(`Failed to delete ${song.fileName}: ${data.message}`);
        } else {
          console.log( `Successfully deleted ${song.fileName}` );
          this.uploadProgress.uploadedCount--;
          this.uploadProgress.totalFiles--;
          if (this.uploadProgress.totalFiles <= 0) {
            this.resetUploadProgress();
          }
        }
      },
      error: (error) => {
        console.error( 'Delete subscription error:', error );
        this.notificationService.showError(`Failed to delete ${song.fileName}. Please try again.`);

        // Re-add the song to the list since deletion failed
        this.songs.splice( index, 0, song );
      }
    });
  }

  isFormValid(): boolean {
    if (this.songs.length === 0) return false;

    return this.songs.every(
      song =>
        song.title &&
        song.artist &&
        song.album &&
        song.genre &&
        song.year &&
        song.track &&
        song.albumArtist &&
        song.discNumber >= 1 &&
        song.cover
    );
  }

  // Returns album groups sorted by name, with songs sorted by track within each
  get albumGroups(): AlbumGroup[] {
    const albumMap = this.groupSongsByAlbum();
    const groups = Array.from(albumMap.values())
      .sort((a, b) => a.albumName.localeCompare(b.albumName));

    for (const group of groups) {
      group.songs.sort((a, b) => a.track - b.track);
    }

    return groups;
  }

  // Groups songs by album name
  private groupSongsByAlbum(): Map<string, AlbumGroup> {
    const albumMap = new Map<string, AlbumGroup>();

    for (const song of this.songs) {
      const albumName = song.album?.trim() || '(Unknown Album)';

      if (!albumMap.has(albumName)) {
        albumMap.set(albumName, {
          albumName,
          songs: [],
          year: song.year,
          albumArtist: song.albumArtist,
          cover: song.cover ?? null
        });
      }
      albumMap.get(albumName)!.songs.push(song);
    }
    return albumMap;
  }

  // Updates all songs in an album with new header value
  updateAlbumField(albumName: string, field: 'year' | 'albumArtist' | 'cover', value: any): void {
    const songsInAlbum = this.songs.filter(s => (s.album?.trim() || '(Unknown Album)') === albumName);
    for (const song of songsInAlbum) {
      // Use type assertion to bypass TypeScript's union type restriction
      (song as any)[field] = value;
    }
  }

  // Triggers regrouping when album name changes
  onSongAlbumChange(song: Song, newAlbumName: string): void {
    song.album = newAlbumName;
    // tableRows getter auto-recomputes on next change detection
  }

  uploadCover(albumName: string): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) {
        this.processImageFile(file, albumName);
      }
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  }

  searchCover(albumName: string): void {
    const group = this.albumGroups.find(g => g.albumName === albumName);
    const artist = group?.songs[0]?.albumArtist || group?.songs[0]?.artist || '';

    const dialogRef = this.dialog.open(CoverSearchDialogComponent, {
      width: '700px',
      maxHeight: '80vh',
      panelClass: 'dark-dialog',
      data: { artist, album: albumName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateAlbumField(albumName, 'cover', result);
      }
    });
  }

  processImageFile(file: File, albumName: string): void {
    if (!MediaUploaderMusicComponent.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.notificationService.showError('Invalid image type. Use JPEG, PNG, WebP, or GIF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth !== img.naturalHeight) {
          this.notificationService.showError('Cover art must be square.');
          return;
        }
        this.updateAlbumField(albumName, 'cover', { format: file.type, data: dataUrl });
      };
      img.onerror = () => {
        this.notificationService.showError('Failed to load image.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  onCoverDrop(event: DragEvent, albumName: string): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.processImageFile(file, albumName);
    }
  }

  onCoverDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private resetUploadProgress(): void {
    this.uploadProgress = {
      isUploading: false,
      uploadedCount: 0,
      totalFiles: 0,
      currentFileProgress: 0,
      hasUploaded: false
    };
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.isLoading = true;
    this.finalizingFiles = new Set(this.songs.map(s => s.fileName));

    this.mediaService.finalizeUpload(this.songs).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.finalizingFiles.clear();

        if (response.status === 200) {
          // Complete success - clear all songs and reset all state
          this.songs = [];
          this.resetUploadProgress();
          this.curTrackNumber = 1;
          this.notificationService.showSuccess('All files uploaded successfully');
        } else if (response.status === 207) {
          // Partial success - show error and remove successful files
          this.notificationService.showError(`${response.processedCount} files uploaded. ${response.failedFiles.length} failed.`);

          // Keep only failed files in table
          this.songs = this.songs.filter(song =>
            response.failedFiles.some(f => f.fileName === song.fileName)
          );

          // Reset counters to reflect the remaining failed files
          this.uploadProgress.uploadedCount = 0;
          this.uploadProgress.totalFiles = response.failedFiles.length;
          this.uploadProgress.currentFileProgress = 0;
          // Leave hasUploaded = true so the counter UI remains visible
        } else if (response.error) {
          this.notificationService.showError(response.message || 'Upload failed. Please try again.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.finalizingFiles.clear();
        this.notificationService.showError(error.message || 'Upload failed. Please try again.');
      }
    });
  }
}
