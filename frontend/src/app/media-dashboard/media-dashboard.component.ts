import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ContributionObject } from '../customTypes';
import { SettingsService } from '../services/settings.service';
import { NotificationService } from '../services/notification.service';

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

  contributions: ContributionObject[] = [];
  totalAlbums: number = 0;
  totalSongs: number = 0;

  newMedia = {
    title: '',
    description: '',
    file: null
  }

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService
  ) {
    this.lastUsedEditor = localStorage.getItem('lastUsedEditor') || 'Music';

    this.getContributions();
  }

  getContributions() {
    this.settingsService.getContributions().subscribe({
      next: (data: any) => {
        if ( !data || !data.data || !data.data.contributions ) {
          console.log( 'No contribution data.' );
          this.contributions = [];
          this.totalAlbums = 0;
          this.totalSongs = 0;
        }
        else {
          this.contributions = data.data.contributions;
          this.totalAlbums = data.data.totalAlbums ?? 0;
          this.totalSongs = data.data.totalSongs ?? 0;
        }
      },
      error: (error) => {
        console.error( 'Error fetching contributions:', error );
        this.notificationService.showError('Failed to load contributions.');
        this.contributions = [];
        this.totalAlbums = 0;
        this.totalSongs = 0;
      }
    });
  }

  selectMediaType(ev: string) {
    localStorage.setItem('lastUsedEditor', ev);
    console.log( `Set editor type to ${ ev }` );
  }
}
