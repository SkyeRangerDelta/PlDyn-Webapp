import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ContributionTile } from '../customTypes';
import { SettingsService } from '../services/settings.service';

@Component({
    selector: 'app-media-dashboard',
    templateUrl: './media-dashboard.component.html',
    styleUrl: './media-dashboard.component.scss',
    providers: [
        MatFormFieldModule
    ],
    standalone: false
})
export class MediaDashboardComponent {
  lastUsedEditor: string = 'Music';

  contributions: ContributionTile[] = [];

  newMedia = {
    title: '',
    description: '',
    file: null
  }

  constructor(
    private settingsService: SettingsService
  ) {
    this.lastUsedEditor = localStorage.getItem('lastUsedEditor') || 'Music';

    this.getContributions();
  }

  getContributions() {
    // fetch contributions
    this.settingsService.getContributions().subscribe({
      next: (data: any) => {
        if ( !data || !data.data || !data.data.contributions ) {
          console.log( 'No contribution data.' );
          this.contributions = [];
        }
        else {
          this.contributions = data.data.contributions;
        }
      },
      error: (error) => {
        console.error( 'Error fetching contributions:', error );
        this.contributions = [];

        // Note: Auth errors (401) are handled by AuthInterceptor
      }
    });
  }

  selectMediaType(ev: string) {
    localStorage.setItem('lastUsedEditor', ev);
    console.log(ev);
  }
}
