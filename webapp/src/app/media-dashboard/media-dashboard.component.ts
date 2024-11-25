import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormGroup } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-media-dashboard',
  templateUrl: './media-dashboard.component.html',
  styleUrl: './media-dashboard.component.scss',
  providers: [
    MatFormFieldModule
  ]
})
export class MediaDashboardComponent {
  private backendHost = '/api/v1/GetRecentContributions';

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
    getContributions();
  }

  getContributions() {
    // fetch contributions
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const payload = { "mediaType": lastUploaderState };

    this.httpClient.post<any>( this.backendHost, payload, { headers: headers } )
  }

  selectMediaType(ev: string) {
    console.log(ev);
  }
}
