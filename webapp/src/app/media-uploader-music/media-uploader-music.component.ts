import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

    this.isLoading = true;
    this.selectedFiles = Array.from( input.files );

    // this.addSongsToTable();
    this.uploadSongs();
  }

  uploadSongs() {
    // Safety check: prevent upload if no files selected
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      console.warn('Upload attempted with no files selected');
      this.isLoading = false;
      this.uploadErrorMessage = 'No files selected for upload.';
      return;
    }

    const formData = new FormData();

    this.selectedFiles.forEach(file => formData.append( 'files', file, file.name ));

    this.MediaService.uploadMedia( formData ).subscribe({
      next: (data: AudioUploadResponse) => {
        this.isLoading = false;

        if ( !data.error ) {
          console.log( 'Upload data has ' + data.uploadData.length + ' entries' );

          this.addSongsToTable( data.uploadData );
        }
        else {
          console.error( 'Error uploading media:', data.message, data.status );
          this.uploadErrorMessage = data.message;

          // Note: Auth errors (401) are now handled by AuthInterceptor
          // which will automatically logout and redirect to /login
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error( 'Upload subscription error:', error );
        this.uploadErrorMessage = 'Failed to upload files. Please try again.';

        // Note: Auth errors (401) are handled by AuthInterceptor before reaching here
      }
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
    if (this.isFormValid()) {
      console.log('Form is valid, submitting data:', this.songs);
    }
  }
}
