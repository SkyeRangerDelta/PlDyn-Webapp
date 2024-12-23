import { Component } from '@angular/core';

@Component({
  selector: 'app-media-uploader-music',
  templateUrl: './media-uploader-music.component.html',
  styleUrl: './media-uploader-music.component.scss'
})
export class MediaUploaderMusicComponent {
  title: string = 'Music';
  album: string = 'Album';
  artist: string = 'Artist';
  genre: string = 'Genre';
  year: string = 'Year';

  onFileChange( $event: Event ) {

  }

  uploadMusic() {

  }

  closeUploader() {

  }
}
