import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { of, throwError, Observable } from 'rxjs';
import { HttpEventType } from '@angular/common/http';
import { MediaUploaderMusicComponent } from './media-uploader-music.component';
import { MediaService } from '../services/media.service';
import { NotificationService } from '../services/notification.service';
import { Song, AudioUploadResponse, DeleteResponse, FinalizeUploadResponse } from '../customTypes';

function makeSong(overrides: Partial<Song> = {}): Song {
  return {
    filePath: '/tmp/test.mp3',
    fileName: 'test.mp3',
    title: 'Test Title',
    artist: 'Test Artist',
    album: 'Test Album',
    genre: ['Test Genre'],
    year: 2021,
    track: 1,
    albumArtist: 'Test Album Artist',
    composer: [''],
    discNumber: 1,
    cover: { format: 'jpeg', data: 'data:image/jpeg;base64,abc' },
    ...overrides
  };
}

describe('MediaUploaderMusicComponent', () => {
  let component: MediaUploaderMusicComponent;
  let fixture: ComponentFixture<MediaUploaderMusicComponent>;
  let mediaServiceSpy: jasmine.SpyObj<MediaService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mediaServiceSpy = jasmine.createSpyObj('MediaService', [
      'uploadSingleFile',
      'clearMedia',
      'finalizeUpload',
      'watchTempFiles'
    ]);
    mediaServiceSpy.watchTempFiles.and.returnValue(of());
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showError',
      'showSuccess'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ MediaUploaderMusicComponent ],
      imports: [ ReactiveFormsModule, FormsModule, HttpClientTestingModule, MatSnackBarModule ],
      providers: [
        { provide: MediaService, useValue: mediaServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaUploaderMusicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnDestroy ────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should remove the document click listener', () => {
      spyOn(document, 'removeEventListener');
      component.ngOnDestroy();
      expect(document.removeEventListener).toHaveBeenCalledWith('click', jasmine.any(Function));
    });
  });

  // ── cleanupMenus ────────────────────────────────────────────────────────────

  describe('cleanupMenus', () => {
    it('should set showContextButtons to false when it was true', () => {
      component.showContextButtons = true;
      component.cleanupMenus();
      expect(component.showContextButtons).toBeFalse();
    });

    it('should leave showContextButtons false when already false', () => {
      component.showContextButtons = false;
      component.cleanupMenus();
      expect(component.showContextButtons).toBeFalse();
    });
  });

  // ── toggleContextButtons ────────────────────────────────────────────────────

  describe('toggleContextButtons', () => {
    it('should set showContextButtons to true when it was false', () => {
      component.showContextButtons = false;
      component.toggleContextButtons();
      expect(component.showContextButtons).toBeTrue();
    });

    it('should set showContextButtons to false when it was true', () => {
      component.showContextButtons = true;
      component.toggleContextButtons();
      expect(component.showContextButtons).toBeFalse();
    });
  });

  // ── onFileSelect ────────────────────────────────────────────────────────────

  describe('onFileSelect', () => {
    it('should set selectedFiles and call uploadSongs when files are present', () => {
      spyOn(component, 'uploadSongs');
      const file = new File([], 'test.mp3');
      const event = { target: { files: [file] } } as unknown as Event;
      component.onFileSelect(event);

      expect(component.selectedFiles.length).toBe(1);
      expect(component.selectedFiles[0]).toBe(file);
      expect(component.uploadSongs).toHaveBeenCalled();
    });

    it('should set isLoading to true when files are present', () => {
      spyOn(component, 'uploadSongs');
      const file = new File([], 'test.mp3');
      const event = { target: { files: [file] } } as unknown as Event;
      component.onFileSelect(event);

      expect(component.isLoading).toBeTrue();
    });

    it('should not call uploadSongs when no files are selected', () => {
      spyOn(component, 'uploadSongs');
      const event = { target: { files: null } } as unknown as Event;
      component.onFileSelect(event);

      expect(component.uploadSongs).not.toHaveBeenCalled();
      expect(component.selectedFiles.length).toBe(0);
    });
  });

  // ── addSongsToTable ──────────────────────────────────────────────────────────

  describe('addSongsToTable', () => {
    it('should add songs to the songs array', () => {
      const song = makeSong();
      component.addSongsToTable([song]);

      expect(component.songs.length).toBe(1);
      expect(component.songs[0]).toBe(song);
    });

    it('should add all fields from a song', () => {
      const song = makeSong({
        title: 'My Title',
        artist: 'My Artist',
        album: 'My Album',
        genre: ['Jazz'],
        year: 2024,
        track: 5,
        albumArtist: 'Various Artists',
        composer: ['Bach'],
        discNumber: 2
      });
      component.addSongsToTable([song]);

      expect(component.songs[0].title).toBe('My Title');
      expect(component.songs[0].artist).toBe('My Artist');
      expect(component.songs[0].album).toBe('My Album');
      expect(component.songs[0].genre).toEqual(['Jazz']);
      expect(component.songs[0].year).toBe(2024);
      expect(component.songs[0].track).toBe(5);
      expect(component.songs[0].albumArtist).toBe('Various Artists');
      expect(component.songs[0].composer).toEqual(['Bach']);
      expect(component.songs[0].discNumber).toBe(2);
    });

    it('should normalize discNumber 0 to 1', () => {
      const song = makeSong({ discNumber: 0 });
      component.addSongsToTable([song]);
      expect(component.songs[0].discNumber).toBe(1);
    });

    it('should not add the same song object twice', () => {
      const song = makeSong();
      component.addSongsToTable([song]);
      component.addSongsToTable([song]);
      expect(component.songs.length).toBe(1);
    });

    it('should set isLoading to false and clear selectedFiles after adding', () => {
      component.isLoading = true;
      component.selectedFiles = [new File([], 'test.mp3')];
      component.addSongsToTable([makeSong()]);

      expect(component.isLoading).toBeFalse();
      expect(component.selectedFiles.length).toBe(0);
    });
  });

  // ── removeSong ────────────────────────────────────────────────────────────

  describe('removeSong', () => {
    it('should remove the song from the list and call clearMedia', () => {
      const song = makeSong();
      component.songs = [song];
      mediaServiceSpy.clearMedia.and.returnValue(
        of({ error: false, message: 'deleted', status: 200 } as DeleteResponse)
      );

      component.removeSong(song);

      expect(component.songs.length).toBe(0);
      expect(mediaServiceSpy.clearMedia).toHaveBeenCalledWith(song.fileName);
    });

    it('should show an error notification when clearMedia returns error: true', () => {
      const song = makeSong();
      component.songs = [song];
      mediaServiceSpy.clearMedia.and.returnValue(
        of({ error: true, message: 'not found', status: 404 } as DeleteResponse)
      );

      component.removeSong(song);

      expect(notificationServiceSpy.showError).toHaveBeenCalled();
      expect(component.songs.length).toBe(0); // still removed; only HTTP errors re-add
    });

    it('should re-add the song and show error notification on HTTP error', () => {
      const song = makeSong();
      component.songs = [song];
      mediaServiceSpy.clearMedia.and.returnValue(
        throwError(() => new Error('network error'))
      );

      component.removeSong(song);

      expect(notificationServiceSpy.showError).toHaveBeenCalled();
      expect(component.songs).toContain(song);
    });
  });

  // ── isFormValid ────────────────────────────────────────────────────────────

  describe('isFormValid', () => {
    it('should return false when songs array is empty', () => {
      component.songs = [];
      expect(component.isFormValid()).toBeFalse();
    });

    it('should return true when all required fields are populated', () => {
      component.songs = [makeSong()];
      expect(component.isFormValid()).toBeTrue();
    });

    it('should return false when title is empty', () => {
      component.songs = [makeSong({ title: '' })];
      expect(component.isFormValid()).toBeFalse();
    });

    it('should return false when artist is empty', () => {
      component.songs = [makeSong({ artist: '' })];
      expect(component.isFormValid()).toBeFalse();
    });

    it('should return false when album is empty', () => {
      component.songs = [makeSong({ album: '' })];
      expect(component.isFormValid()).toBeFalse();
    });

    it('should return false when albumArtist is empty', () => {
      component.songs = [makeSong({ albumArtist: '' })];
      expect(component.isFormValid()).toBeFalse();
    });

    it('should return false when cover is missing', () => {
      component.songs = [makeSong({ cover: undefined })];
      expect(component.isFormValid()).toBeFalse();
    });

    it('should return false when discNumber is less than 1', () => {
      component.songs = [makeSong({ discNumber: 0 })];
      expect(component.isFormValid()).toBeFalse();
    });

    it('should return false when any song in a multi-song list is invalid', () => {
      component.songs = [makeSong({ fileName: 'a.mp3' }), makeSong({ fileName: 'b.mp3', title: '' })];
      expect(component.isFormValid()).toBeFalse();
    });
  });

  // ── albumGroups getter ───────────────────────────────────────────────────

  describe('albumGroups', () => {
    it('should return an empty array when there are no songs', () => {
      component.songs = [];
      expect(component.albumGroups.length).toBe(0);
    });

    it('should produce one album group with one song for a single song', () => {
      component.songs = [makeSong()];
      const groups = component.albumGroups;
      expect(groups.length).toBe(1);
      expect(groups[0].songs.length).toBe(1);
    });

    it('should group songs under the same album', () => {
      component.songs = [
        makeSong({ track: 1, fileName: 'a.mp3' }),
        makeSong({ track: 2, fileName: 'b.mp3' }),
      ];
      const groups = component.albumGroups;
      expect(groups.length).toBe(1);
      expect(groups[0].songs.length).toBe(2);
    });

    it('should create separate groups for different albums', () => {
      component.songs = [
        makeSong({ album: 'Album A', fileName: 'a.mp3' }),
        makeSong({ album: 'Album B', fileName: 'b.mp3' }),
      ];
      const groups = component.albumGroups;
      expect(groups.length).toBe(2);
    });

    it('should sort album groups alphabetically', () => {
      component.songs = [
        makeSong({ album: 'Zebra', fileName: 'z.mp3' }),
        makeSong({ album: 'Apple', fileName: 'a.mp3' }),
      ];
      const groups = component.albumGroups;
      expect(groups[0].albumName).toBe('Apple');
      expect(groups[1].albumName).toBe('Zebra');
    });

    it('should sort songs within an album by track number', () => {
      component.songs = [
        makeSong({ track: 3, fileName: 'c.mp3' }),
        makeSong({ track: 1, fileName: 'a.mp3' }),
        makeSong({ track: 2, fileName: 'b.mp3' }),
      ];
      const songs = component.albumGroups[0].songs;
      expect(songs[0].track).toBe(1);
      expect(songs[1].track).toBe(2);
      expect(songs[2].track).toBe(3);
    });

    it('should use "(Unknown Album)" for songs with empty album', () => {
      component.songs = [makeSong({ album: '' })];
      const groups = component.albumGroups;
      expect(groups[0].albumName).toBe('(Unknown Album)');
    });
  });

  // ── updateAlbumField ──────────────────────────────────────────────────────

  describe('updateAlbumField', () => {
    it('should update year for all songs in the specified album', () => {
      const songs = [
        makeSong({ album: 'Test Album', fileName: 'a.mp3' }),
        makeSong({ album: 'Test Album', fileName: 'b.mp3' }),
      ];
      component.songs = songs;
      component.updateAlbumField('Test Album', 'year', 2025);
      expect(songs[0].year).toBe(2025);
      expect(songs[1].year).toBe(2025);
    });

    it('should update albumArtist for all songs in the specified album', () => {
      const song = makeSong({ album: 'Test Album' });
      component.songs = [song];
      component.updateAlbumField('Test Album', 'albumArtist', 'New Artist');
      expect(song.albumArtist).toBe('New Artist');
    });

    it('should not update songs from other albums', () => {
      const songA = makeSong({ album: 'Album A', fileName: 'a.mp3', year: 2000 });
      const songB = makeSong({ album: 'Album B', fileName: 'b.mp3', year: 2000 });
      component.songs = [songA, songB];
      component.updateAlbumField('Album A', 'year', 2025);
      expect(songA.year).toBe(2025);
      expect(songB.year).toBe(2000);
    });
  });

  // ── onSongAlbumChange ─────────────────────────────────────────────────────

  describe('onSongAlbumChange', () => {
    it('should update the song album property', () => {
      const song = makeSong({ album: 'Old Album' });
      component.onSongAlbumChange(song, 'New Album');
      expect(song.album).toBe('New Album');
    });
  });

  // ── uploadSongs ───────────────────────────────────────────────────────────

  describe('uploadSongs', () => {
    it('should show an error and not call uploadSingleFile when selectedFiles is empty', async () => {
      component.selectedFiles = [];
      await component.uploadSongs();
      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('No files selected for upload.');
      expect(mediaServiceSpy.uploadSingleFile).not.toHaveBeenCalled();
    });

    it('should initialize progress tracking before uploading', async () => {
      component.selectedFiles = [new File([], 'test.mp3')];
      const responseEvent = {
        type: HttpEventType.Response,
        body: { error: false, uploadData: [makeSong()], message: 'ok', status: 200 } as AudioUploadResponse
      };
      mediaServiceSpy.uploadSingleFile.and.returnValue(of(responseEvent as any));

      await component.uploadSongs();

      expect(component.uploadProgress.hasUploaded).toBeTrue();
      expect(component.uploadProgress.totalFiles).toBe(1);
    });

    it('should increment uploadedCount and clear isLoading on successful upload', async () => {
      component.selectedFiles = [new File([], 'test.mp3')];
      const responseEvent = {
        type: HttpEventType.Response,
        body: { error: false, uploadData: [makeSong()], message: 'ok', status: 200 } as AudioUploadResponse
      };
      mediaServiceSpy.uploadSingleFile.and.returnValue(of(responseEvent as any));

      await component.uploadSongs();

      expect(component.uploadProgress.uploadedCount).toBe(1);
      expect(component.uploadProgress.isUploading).toBeFalse();
      expect(component.isLoading).toBeFalse();
    });

    it('should update currentFileProgress during upload progress events', async () => {
      component.selectedFiles = [new File([], 'test.mp3')];
      let capturedProgress = 0;

      mediaServiceSpy.uploadSingleFile.and.callFake(() => {
        return new Observable(observer => {
          observer.next({ type: HttpEventType.UploadProgress, loaded: 75, total: 100 } as any);
          capturedProgress = component.uploadProgress.currentFileProgress;
          observer.next({
            type: HttpEventType.Response,
            body: { error: false, uploadData: [makeSong()], message: 'ok', status: 200 }
          } as any);
          observer.complete();
        });
      });

      await component.uploadSongs();

      expect(capturedProgress).toBe(75);
    });

    it('should show an error and continue to the next file when one upload fails', async () => {
      const files = [new File([], 'a.mp3'), new File([], 'b.mp3')];
      component.selectedFiles = [...files];

      const successEvent = {
        type: HttpEventType.Response,
        body: { error: false, uploadData: [makeSong({ fileName: 'b.mp3' })], message: 'ok', status: 200 }
      };
      mediaServiceSpy.uploadSingleFile.and.returnValues(
        throwError(() => new Error('upload failed')),
        of(successEvent as any)
      );

      await component.uploadSongs();

      expect(mediaServiceSpy.uploadSingleFile).toHaveBeenCalledTimes(2);
      // Two showError calls per failed file: once in uploadSingleFile's error handler,
      // once in uploadSongs' catch block.
      expect(notificationServiceSpy.showError).toHaveBeenCalledTimes(2);
      expect(component.uploadProgress.uploadedCount).toBe(1);
    });
  });

  // ── onSubmit ──────────────────────────────────────────────────────────────

  describe('onSubmit', () => {
    it('should not call finalizeUpload when the form is invalid', () => {
      component.songs = [];
      component.onSubmit();
      expect(mediaServiceSpy.finalizeUpload).not.toHaveBeenCalled();
    });

    it('should clear all songs and show success notification on status 200', () => {
      component.songs = [makeSong()];
      mediaServiceSpy.finalizeUpload.and.returnValue(of({
        status: 200, message: 'ok', error: false, processedCount: 1, failedFiles: []
      } as FinalizeUploadResponse));

      component.onSubmit();

      expect(component.songs.length).toBe(0);
      expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('All files uploaded successfully');
      expect(component.isLoading).toBeFalse();
    });

    it('should keep only failed songs and show an error notification on status 207', () => {
      const songA = makeSong({ fileName: 'a.mp3' });
      const songB = makeSong({ fileName: 'b.mp3' });
      component.songs = [songA, songB];

      mediaServiceSpy.finalizeUpload.and.returnValue(of({
        status: 207,
        message: '1 files uploaded. 1 failed.',
        error: false,
        processedCount: 1,
        failedFiles: [{ fileName: 'b.mp3', errorType: 'metadata_write', errorMessage: 'write failed' }]
      } as FinalizeUploadResponse));

      component.onSubmit();

      expect(component.songs.length).toBe(1);
      expect(component.songs[0].fileName).toBe('b.mp3');
      expect(notificationServiceSpy.showError).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should show error notification when response has error flag set', () => {
      component.songs = [makeSong()];
      mediaServiceSpy.finalizeUpload.and.returnValue(of({
        status: 500, message: 'Server error', error: true, processedCount: 0, failedFiles: []
      } as FinalizeUploadResponse));

      component.onSubmit();

      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Server error');
      expect(component.isLoading).toBeFalse();
    });

    it('should show error notification and clear isLoading on HTTP error', () => {
      component.songs = [makeSong()];
      mediaServiceSpy.finalizeUpload.and.returnValue(
        throwError(() => new Error('network error'))
      );

      component.onSubmit();

      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('network error');
      expect(component.isLoading).toBeFalse();
    });
  });

  // ── DOM: submit button state ─────────────────────────────────────────────

  describe('submit button', () => {
    it('should be disabled when the form is invalid', () => {
      component.songs = [makeSong({ album: '' })];
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#submit-btn'));
      expect(btn.nativeElement.disabled).toBeTrue();
    });

    it('should be enabled when the form is valid', () => {
      component.songs = [makeSong()];
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('#submit-btn'));
      expect(btn.nativeElement.disabled).toBeFalse();
    });
  });
});
