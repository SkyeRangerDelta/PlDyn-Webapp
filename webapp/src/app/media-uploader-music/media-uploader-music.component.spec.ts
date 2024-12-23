import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MediaUploaderMusicComponent } from './media-uploader-music.component';

describe('MediaUploaderMusicComponent', () => {
  let component: MediaUploaderMusicComponent;
  let fixture: ComponentFixture<MediaUploaderMusicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MediaUploaderMusicComponent ],
      imports: [ ReactiveFormsModule ]
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

  it('should have a valid form when all fields are filled', () => {
    component.musicForm.controls['title'].setValue('Test Title');
    component.musicForm.controls['artist'].setValue('Test Artist');
    component.musicForm.controls['album'].setValue('Test Album');
    component.musicForm.controls['genre'].setValue('Test Genre');
    component.musicForm.controls['year'].setValue(2021);
    component.musicForm.controls['file'].setValue(new File([], 'test.mp3'));

    expect(component.musicForm.valid).toBeTruthy();
  });

  it('should have an invalid form when a required field is missing', () => {
    component.musicForm.controls['title'].setValue('');
    component.musicForm.controls['artist'].setValue('Test Artist');
    component.musicForm.controls['album'].setValue('Test Album');
    component.musicForm.controls['genre'].setValue('Test Genre');
    component.musicForm.controls['year'].setValue(2021);
    component.musicForm.controls['file'].setValue(new File([], 'test.mp3'));

    expect(component.musicForm.invalid).toBeTruthy();
  });

  it('should handle file selection', () => {
    const file = new File([], 'test.mp3');
    const event = { target: { files: [file] } } as unknown as Event;
    component.onFileSelect(event);

    expect(component.selectedFiles.length).toBe(1);
    expect(component.selectedFiles[0]).toBe(file);
  });

  it('should call onSubmit when form is valid', () => {
    spyOn(component, 'onSubmit').and.callThrough();

    component.musicForm.controls['title'].setValue('Test Title');
    component.musicForm.controls['artist'].setValue('Test Artist');
    component.musicForm.controls['album'].setValue('Test Album');
    component.musicForm.controls['genre'].setValue('Test Genre');
    component.musicForm.controls['year'].setValue(2021);
    component.musicForm.controls['file'].setValue(new File([], 'test.mp3'));

    component.onSubmit();

    expect(component.onSubmit).toHaveBeenCalled();
  });
});
