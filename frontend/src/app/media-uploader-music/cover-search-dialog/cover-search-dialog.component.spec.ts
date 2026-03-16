import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { CoverSearchDialogComponent } from './cover-search-dialog.component';
import { MediaService } from '../../services/media.service';
import { NotificationService } from '../../services/notification.service';
import { CoverArtSearchResult } from '../../customTypes';

describe('CoverSearchDialogComponent', () => {
  let component: CoverSearchDialogComponent;
  let fixture: ComponentFixture<CoverSearchDialogComponent>;
  let mediaServiceSpy: jasmine.SpyObj<MediaService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CoverSearchDialogComponent>>;

  const mockData = { artist: 'Test Artist', album: 'Test Album' };

  const mockResult: CoverArtSearchResult = {
    releaseId: 'abc-123',
    title: 'Test Album',
    artist: 'Test Artist',
    date: '2021',
    thumbnailUrl: 'https://coverartarchive.org/release/abc-123/thumb250.jpg',
    fullUrl: 'https://coverartarchive.org/release/abc-123/front.jpg',
    source: 'musicbrainz'
  };

  beforeEach(async () => {
    mediaServiceSpy = jasmine.createSpyObj('MediaService', ['searchCoverArt', 'fetchCoverArt']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    mediaServiceSpy.searchCoverArt.and.returnValue(of({ status: 200, message: 'OK', results: [mockResult] }));

    await TestBed.configureTestingModule({
      declarations: [CoverSearchDialogComponent],
      providers: [
        { provide: MediaService, useValue: mediaServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CoverSearchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call searchCoverArt on init with injected data', () => {
    expect(mediaServiceSpy.searchCoverArt).toHaveBeenCalledWith('Test Artist', 'Test Album');
  });

  it('should display results after search completes', () => {
    expect(component.isLoading).toBeFalse();
    expect(component.results.length).toBe(1);
    expect(component.results[0].releaseId).toBe('abc-123');
  });

  it('should show empty state when no results', () => {
    mediaServiceSpy.searchCoverArt.and.returnValue(of({ status: 200, message: 'OK', results: [] }));
    component.ngOnInit();
    expect(component.results.length).toBe(0);
    expect(component.isLoading).toBeFalse();
  });

  it('should call fetchCoverArt and close dialog with cover data on result click', () => {
    const coverData = { format: 'image/jpeg', data: 'data:image/jpeg;base64,abc' };
    mediaServiceSpy.fetchCoverArt.and.returnValue(of({ status: 200, message: 'OK', cover: coverData }));

    component.selectCover(mockResult);

    expect(mediaServiceSpy.fetchCoverArt).toHaveBeenCalledWith(mockResult.fullUrl);
    expect(dialogRefSpy.close).toHaveBeenCalledWith(coverData);
  });

  it('should show error when fetchCoverArt returns null cover', () => {
    mediaServiceSpy.fetchCoverArt.and.returnValue(of({ status: 502, message: 'error', cover: null }));

    component.selectCover(mockResult);

    expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Failed to fetch cover art');
  });

  it('should close dialog with null on cancel', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('should handle search error gracefully', () => {
    mediaServiceSpy.searchCoverArt.and.returnValue(throwError(() => new Error('network')));
    component.ngOnInit();
    expect(component.isLoading).toBeFalse();
    expect(component.results.length).toBe(0);
  });
});
