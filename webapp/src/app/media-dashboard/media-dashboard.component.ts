import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpHeaders } from '@angular/common/http';
import { ContributionTile } from '../customTypes';
import { Router } from '@angular/router';

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

  lastUsedEditor: string = 'Music';

  contributions: ContributionTile[] = [];

  newMedia = {
    title: '',
    description: '',
    file: null
  }

  constructor(private router: Router) {
    this.lastUsedEditor = localStorage.getItem('lastUsedEditor') || 'Music';

    this.getContributions();
  }

  getContributions() {
    // fetch contributions
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // const payload = { "mediaType": lastUploaderState };

    // this.httpClient.post<any>( this.backendHost, payload, { headers: headers } )
  }

  selectMediaType(ev: string) {
    localStorage.setItem('lastUsedEditor', ev);
    console.log(ev);
  }

  navigateToMediaUploaderMusic() {
    this.router.navigate(['/media-uploader-music']);
  }
}
