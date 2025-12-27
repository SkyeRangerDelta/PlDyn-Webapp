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
    this.settingsService.getContributions().subscribe( (data: any) => {

      if ( !data || !data.contributions ) {
        console.log( 'No contribution data.' )
      }
      else {
        this.contributions = data.contributions;
      }
    });
  }

  selectMediaType(ev: string) {
    localStorage.setItem('lastUsedEditor', ev);
    console.log(ev);
  }
}
