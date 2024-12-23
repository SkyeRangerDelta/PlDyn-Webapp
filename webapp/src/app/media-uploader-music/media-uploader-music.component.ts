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

  onSubmit(): void {
    if (this.musicForm.valid) {
      const formData = new FormData();
      this.selectedFiles.forEach(file => formData.append('files', file));
      formData.append('title', this.musicForm.get('title')?.value);
      formData.append('artist', this.musicForm.get('artist')?.value);
      formData.append('album', this.musicForm.get('album')?.value);
      formData.append('genre', this.musicForm.get('genre')?.value);
      formData.append('year', this.musicForm.get('year')?.value);

      // Execute API call to upload the data to the server
      // Example: this.http.post('/api/upload', formData).subscribe(response => console.log(response));
    }
  }
}
