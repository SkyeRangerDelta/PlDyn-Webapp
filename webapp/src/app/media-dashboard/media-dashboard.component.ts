import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-media-dashboard',
  templateUrl: './media-dashboard.component.html',
  styleUrl: './media-dashboard.component.scss',
  providers: [
    MatFormFieldModule
  ]
})
export class MediaDashboardComponent {
  newUploadForm: FormGroup;

  contributions = [
    {
      thumbnailUrl: '',
      title: '',
      status: ''
    }
  ];

  newMedia = {
    title: '',
    description: '',
    file: null
  }

  constructor() {
    this.newUploadForm = new FormGroup({});
  }

  onSubmit() {
    // Submit
  }

  onFileSelect( event: Event ) {
    // File selected
  }
}
