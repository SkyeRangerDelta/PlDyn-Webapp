import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MediaUploaderMusicComponent } from './media-uploader-music.component';
import { By } from '@angular/platform-browser';

describe('MediaUploaderMusicComponent', () => {
  let component: MediaUploaderMusicComponent;
  let fixture: ComponentFixture<MediaUploaderMusicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MediaUploaderMusicComponent ],
      imports: [ ReactiveFormsModule, FormsModule ]
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

  it('should handle file selection', () => {
    const file = new File([], 'test.mp3');
    const event = { target: { files: [file] } } as unknown as Event;
    component.onFileSelect(event);

    expect(component.selectedFiles.length).toBe(1);
    expect(component.selectedFiles[0]).toBe(file);
  });

  it('should add songs to the table', () => {
    const file = new File([], 'test.mp3');
    component.selectedFiles = [file];
    spyOn(component, 'readMetadata').and.callFake((file, song) => {
      song.title = 'Test Title';
      song.artist = 'Test Artist';
      song.album = 'Test Album';
      song.genre = 'Test Genre';
      song.year = '2021';
    });

    component.addSongsToTable();

    expect(component.songs.length).toBe(1);
    expect(component.songs[0].title).toBe('Test Title');
    expect(component.songs[0].artist).toBe('Test Artist');
    expect(component.songs[0].album).toBe('Test Album');
    expect(component.songs[0].genre).toBe('Test Genre');
    expect(component.songs[0].year).toBe('2021');
  });

  it('should validate that all cells are populated before submission', () => {
    component.songs = [
      { title: 'Test Title', artist: 'Test Artist', album: 'Test Album', genre: 'Test Genre', year: '2021' }
    ];

    expect(component.isFormValid()).toBeTruthy();

    component.songs[0].title = '';
    expect(component.isFormValid()).toBeFalsy();
  });

  it('should call onSubmit when form is valid', () => {
    spyOn(component, 'onSubmit').and.callThrough();

    component.songs = [
      { title: 'Test Title', artist: 'Test Artist', album: 'Test Album', genre: 'Test Genre', year: '2021' }
    ];

    component.onSubmit();

    expect(component.onSubmit).toHaveBeenCalled();
  });

  it('should disable submit button when form is invalid', () => {
    component.songs = [
      { title: '', artist: 'Test Artist', album: 'Test Album', genre: 'Test Genre', year: '2021' }
    ];
    fixture.detectChanges();

    const submitButton = fixture.debugElement.query(By.css('button[disabled]'));
    expect(submitButton).toBeTruthy();
  });
});
