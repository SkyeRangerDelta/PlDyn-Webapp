import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MediaService } from '../../services/media.service';
import { NotificationService } from '../../services/notification.service';
import { CoverArtSearchResult } from '../../customTypes';

export interface CoverSearchDialogData {
  artist: string;
  album: string;
}

@Component({
  selector: 'app-cover-search-dialog',
  templateUrl: './cover-search-dialog.component.html',
  styleUrls: ['./cover-search-dialog.component.scss'],
  standalone: false
})
export class CoverSearchDialogComponent implements OnInit {
  results: CoverArtSearchResult[] = [];
  isLoading = true;
  isFetching = false;

  constructor(
    private dialogRef: MatDialogRef<CoverSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CoverSearchDialogData,
    private mediaService: MediaService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.mediaService.searchCoverArt(this.data.artist, this.data.album).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.results = response.results || [];
      },
      error: () => {
        this.isLoading = false;
        this.results = [];
      }
    });
  }

  selectCover(result: CoverArtSearchResult): void {
    this.isFetching = true;
    this.mediaService.fetchCoverArt(result.fullUrl).subscribe({
      next: (response) => {
        this.isFetching = false;
        if (response.cover) {
          this.dialogRef.close(response.cover);
        } else {
          this.notificationService.showError('Failed to fetch cover art');
        }
      },
      error: () => {
        this.isFetching = false;
        this.notificationService.showError('Failed to fetch cover art');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
