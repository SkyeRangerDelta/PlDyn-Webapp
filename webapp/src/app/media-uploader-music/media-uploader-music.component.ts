import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { AudioUploadResponse, DeleteResponse, Song } from '../customTypes';

import { MediaService } from '../services/media.service';

@Component({
    selector: 'app-media-uploader-music',
    templateUrl: './media-uploader-music.component.html',
    styleUrls: ['./media-uploader-music.component.scss'],
    standalone: false
})
export class MediaUploaderMusicComponent implements OnInit {
  musicForm: FormGroup;
  selectedFiles: File[] = [];
  songs: Song[] = [];

  uploadErrorMessage = '';

  curTrackNumber = 1;

  isLoading = false;
  showContextButtons = false;

  // Upload progress tracking
  uploadProgress = {
    isUploading: false,
    uploadedCount: 0,
    totalFiles: 0,
    currentFileProgress: 0,
    hasUploaded: false  // Track if any uploads have occurred
  };

  constructor(
    private fb: FormBuilder,
    private MediaService: MediaService
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
    document.addEventListener( 'click', () => this.cleanupMenus() );
  }

  ngOnDestroy(): void {
    document.removeEventListener( 'click', () => this.cleanupMenus() );
  }

  cleanupMenus(): void {
    if ( this.showContextButtons ) {
      console.log('Cleanup menus');
      this.showContextButtons = false;
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      console.log('No files selected');
      this.uploadErrorMessage = '';
      return;
    }

    // Clear any previous error messages when starting a new upload
    this.uploadErrorMessage = '';
    this.isLoading = true;
    this.selectedFiles = Array.from( input.files );

    // this.addSongsToTable();
    this.uploadSongs();
  }

  async uploadSongs() {
    // Safety check: prevent upload if no files selected
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      console.warn('Upload attempted with no files selected');
      this.isLoading = false;
      this.uploadErrorMessage = 'No files selected for upload.';
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
        this.uploadErrorMessage = `Failed to upload ${file.name}: ${error.message || 'Unknown error'}`;
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
      this.MediaService.uploadSingleFile(file).subscribe({
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
              // Clear any previous error messages on successful upload
              this.uploadErrorMessage = '';

              // Add the uploaded song to the table
              this.addSongsToTable(data.uploadData);
              resolve();
            } else {
              console.error('Error in response data:', data.message, data.status);
              this.uploadErrorMessage = data.message;
              reject(new Error(data.message));
            }
          }
        },
        error: (error) => {
          console.error('HTTP error during upload:', error);
          // Note: Auth errors (401) are now handled by AuthInterceptor
          this.uploadErrorMessage = error.message || 'Internal server error';
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

    this.MediaService.clearMedia( song.fileName ).subscribe({
      next: (data: DeleteResponse) => {
        if ( data.error ) {
          console.error( 'Error deleting media:', data.message, data.status );
          this.uploadErrorMessage = `Failed to delete ${song.fileName}: ${data.message}`;
        } else {
          console.log( `Successfully deleted ${song.fileName}` );
          // Clear error message on successful deletion
          this.uploadErrorMessage = '';
        }
      },
      error: (error) => {
        console.error( 'Delete subscription error:', error );
        this.uploadErrorMessage = `Failed to delete ${song.fileName}. Please try again.`;

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

  toggleContextButtons(): void {
    console.log('Context buttons');
    event?.stopPropagation();
    this.showContextButtons = !this.showContextButtons;
  }

  searchCover( song: Song ) {
    console.log( 'Searching for cover:', song.title );
  }

  uploadCover( song: Song ) {
    console.log( 'Uploading cover:', song.title );
  }

  pasteCover( song: Song ) {
    console.log( 'Pasting cover:', song.title );
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.isLoading = true;
    this.uploadErrorMessage = '';

    this.MediaService.finalizeUpload(this.songs).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.status === 200) {
          // Complete success - clear all songs
          this.songs = [];
          console.log('All files uploaded successfully');
        } else if (response.status === 207) {
          // Partial success - show error and remove successful files
          this.uploadErrorMessage = `${response.processedCount} files uploaded. ${response.failedFiles.length} failed.`;

          // Keep only failed files in table
          this.songs = this.songs.filter(song =>
            response.failedFiles.some(f => f.fileName === song.fileName)
          );
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.uploadErrorMessage = error.message || 'Upload failed. Please try again.';
      }
    });
  }
}
