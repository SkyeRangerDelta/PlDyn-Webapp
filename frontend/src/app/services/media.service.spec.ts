import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MediaService],
    });
    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchCoverArt', () => {
    it('should send GET request with artist and album params', () => {
      service.searchCoverArt('Artist', 'Album').subscribe(res => {
        expect(res.status).toBe(200);
        expect(res.results.length).toBe(0);
      });

      const req = httpMock.expectOne(r =>
        r.url === '/api/v1/jellyfin/cover-search' &&
        r.params.get('artist') === 'Artist' &&
        r.params.get('album') === 'Album'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ status: 200, message: 'OK', results: [] });
    });

    it('should return fallback response on error', () => {
      service.searchCoverArt('Artist', 'Album').subscribe(res => {
        expect(res.results).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url === '/api/v1/jellyfin/cover-search');
      req.error(new ProgressEvent('error'));
    });
  });

  describe('fetchCoverArt', () => {
    it('should send POST request with url in body', () => {
      const testUrl = 'https://coverartarchive.org/release/abc/front.jpg';
      service.fetchCoverArt(testUrl).subscribe(res => {
        expect(res.status).toBe(200);
        expect(res.cover).toBeTruthy();
      });

      const req = httpMock.expectOne('/api/v1/jellyfin/cover-fetch');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ url: testUrl });
      req.flush({ status: 200, message: 'OK', cover: { format: 'image/jpeg', data: 'data:...' } });
    });

    it('should return fallback response on error', () => {
      service.fetchCoverArt('https://example.com/img.jpg').subscribe(res => {
        expect(res.cover).toBeNull();
      });

      const req = httpMock.expectOne('/api/v1/jellyfin/cover-fetch');
      req.error(new ProgressEvent('error'));
    });
  });
});
