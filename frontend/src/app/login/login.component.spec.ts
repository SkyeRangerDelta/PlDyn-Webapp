import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { LoginComponent } from './login.component';
import { MaterialModule } from '../material_module';
import { HttpClientModule } from '@angular/common/http';

/** Build and return a LoginComponent with the given query params. */
async function createComponent(queryParams: Record<string, string> = {}): Promise<LoginComponent> {
  await TestBed.configureTestingModule({
    declarations: [LoginComponent],
    imports: [MaterialModule, HttpClientModule, RouterTestingModule],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParams } },
      },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<LoginComponent> = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('LoginComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('should create', async () => {
    const component = await createComponent();
    expect(component).toBeTruthy();
  });

  // ── returnUrl validation (fix 4: open redirect) ──────────────────────────

  it('should default returnUrl to /media when no query param is set', async () => {
    const component = await createComponent();
    expect(component.returnUrl).toBe('/media');
  });

  it('should accept a valid relative returnUrl', async () => {
    const component = await createComponent({ returnUrl: '/music-editor' });
    expect(component.returnUrl).toBe('/music-editor');
  });

  it('should reject an absolute URL and default to /media', async () => {
    const component = await createComponent({ returnUrl: 'https://evil.com' });
    expect(component.returnUrl).toBe('/media');
  });

  it('should reject a protocol-relative URL (//evil.com)', async () => {
    const component = await createComponent({ returnUrl: '//evil.com' });
    expect(component.returnUrl).toBe('/media');
  });

  it('should reject a URL that does not start with /', async () => {
    const component = await createComponent({ returnUrl: 'evil.com/phish' });
    expect(component.returnUrl).toBe('/media');
  });
});
