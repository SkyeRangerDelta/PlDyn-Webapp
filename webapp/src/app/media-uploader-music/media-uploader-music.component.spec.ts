import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaUploaderMusicComponent } from './media-uploader-music.component';

describe('MediaUploaderMusicComponent', () => {
  let component: MediaUploaderMusicComponent;
  let fixture: ComponentFixture<MediaUploaderMusicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MediaUploaderMusicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaUploaderMusicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
