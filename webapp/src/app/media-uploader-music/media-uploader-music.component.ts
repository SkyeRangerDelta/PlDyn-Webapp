import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-media-uploader-music',
  templateUrl: './media-uploader-music.component.html',
  styleUrls: ['./media-uploader-music.component.scss']
})
export class MediaUploaderMusicComponent implements OnInit {
  musicForm: FormGroup;
  selectedFiles: File[] = [];
  songs: any[] = [];

  constructor(private fb: FormBuilder) {
    this.musicForm = this.fb.group({
      title: ['', Validators.required],
      artist: ['', Validators.required],
      album: ['', Validators.required],
      genre: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {}

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  addSongsToTable(): void {
    this.selectedFiles.forEach(file => {
      const song = {
        title: '',
        artist: '',
        album: '',
        genre: '',
        year: ''
      };
      this.readMetadata(file, song);
      this.songs.push(song);
    });
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
    return this.songs.every(song => song.title && song.artist && song.album && song.genre && song.year);
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const formData = new FormData();
      this.selectedFiles.forEach(file => formData.append('files', file));
      this.songs.forEach(song => {
        formData.append('title', song.title);
        formData.append('artist', song.artist);
        formData.append('album', song.album);
        formData.append('genre', song.genre);
        formData.append('year', song.year);
      });

      // Execute API call to upload the data to the server
      // Example: this.http.post('/api/upload', formData).subscribe(response => console.log(response));
    }
  }
}
