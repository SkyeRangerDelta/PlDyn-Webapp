import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AudioUploadResponse, MediaResult, Song } from '../customTypes';

import { MediaService } from '../services/media.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-media-uploader-music',
  templateUrl: './media-uploader-music.component.html',
  styleUrls: ['./media-uploader-music.component.scss']
})
export class MediaUploaderMusicComponent implements OnInit {
  musicForm: FormGroup;
  selectedFiles: File[] = [];
  songs: Song[] = [];

  uploadErrorMessage = '';

  curTrackNumber = 1;

  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private MediaService: MediaService,
    private AuthService: AuthService,
    private router: Router
  ) {
    if ( !this.AuthService.isAuthenticated ) {
      this.router.navigate(['/login']);
    }

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

  ngOnInit(): void {}

  onFileSelect(event: Event): void {
    this.isLoading = true;

    console.log( 'onFileSelect', event );

    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }

    // this.addSongsToTable();
    this.uploadSongs();
  }

  uploadSongs() {
    const formData = new FormData();
    this.selectedFiles.forEach(file => formData.append( 'files', file, file.name ));

    this.MediaService.uploadMedia( formData ).subscribe( (data: AudioUploadResponse) => {
      this.isLoading = false;

      if ( !data.error ) {
        console.log( 'Upload data has ' + data.uploadData.length + ' entries' );

        this.addSongsToTable( data.uploadData );
      }
      else {
        console.error( 'Error uploading media:', data.message, data.status );
        this.uploadErrorMessage = data.message;


      }
    });
  }

  addSongsToTable( songData: Song[] ): void {
    songData.forEach( song => {
      if ( song.discNumber === 0 ) song.discNumber = 1;
      this.songs.push( song );
    } );

    this.isLoading = false;
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

  onSubmit(): void {
    if (this.isFormValid()) {
      console.log('Form is valid, submitting data:', this.songs);

      // Execute API call to upload the data to the server
      // Example: this.http.post('/api/upload', formData).subscribe(response => console.log(response));
    }
  }
}
