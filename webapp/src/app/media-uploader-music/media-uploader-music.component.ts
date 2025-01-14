import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AudioUploadResponse, MediaResult, Song } from '../customTypes';

import { MediaService } from '../services/media.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

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
        console.log( 'Media uploaded successfully.' );

        //TODO: Parse uploadData returned and add to table

        console.log( data );

        console.log( 'Upload data has ' + data.uploadData.length + ' entries' );
      }
      else {
        console.error( 'Error uploading media:', data.message, data.status );
        this.uploadErrorMessage = data.message;


      }
    });
  }

  //TODO: REMOVE TEMP TEST DATA
  addSongsToTable(): void {
    this.selectedFiles.forEach(file => {
      const song = {
        filePath: file.name,
        title: 'test',
        artist: 'test',
        album: 'test',
        genre: ['test'],
        year: 2024,
        track: this.curTrackNumber,
        albumArtist: 'test',
        composer: [''],
        discNumber: 1,
        cover: {
          format: 'jpg',
          data: new Uint8Array()
        }
      } as Song;
      this.readMetadata(file, song);
      this.songs.push(song);
      this.curTrackNumber++;
    });

    this.isLoading = false;
  }

  readMetadata(file: File, song: any): void {
    // Logic to read metadata from the file and populate the song object
    // Example: using a library like music-metadata-browser to read metadata
    // musicMetadata.parseBlob(file).then(metadata => {
    //   song.title = metadata.common.title || '';
    //   song.artist = metadata.common.artist || '';
    //   song.album = metadata.common.album || '';
    //   song.genre = metadata.common.genre || '';
    //   song.year = metadata.common.year || '';
    // });
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
        song.discNumber
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
