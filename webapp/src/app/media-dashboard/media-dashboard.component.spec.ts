import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaDashboardComponent } from './media-dashboard.component';
import { MaterialModule } from '../material_module';

describe('MediaDashboardComponent', () => {
  let component: MediaDashboardComponent;
  let fixture: ComponentFixture<MediaDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MediaDashboardComponent],
      imports: [
        MaterialModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
