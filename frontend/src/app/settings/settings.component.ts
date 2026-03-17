import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { NotificationService } from '../services/notification.service';
import { ClientSettings } from '../customTypes';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  standalone: false
})
export class SettingsComponent implements OnInit {
  settings: ClientSettings = { lastUsedEditor: '' };
  isLoading = true;

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success && result.settings) {
          this.settings = result.settings;
        }
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Failed to load settings.');
      }
    });
  }

  saveSettings(): void {
    this.settingsService.updateSettings(this.settings).subscribe({
      next: (result) => {
        if (result.success) {
          this.notificationService.showSuccess('Settings saved.');
        } else {
          this.notificationService.showError(result.message || 'Failed to save settings.');
        }
      },
      error: () => {
        this.notificationService.showError('Failed to save settings.');
      }
    });
  }
}
