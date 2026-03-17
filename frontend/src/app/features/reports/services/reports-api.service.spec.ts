import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { ReportsApiService } from './reports-api.service';

describe('ReportsApiService', () => {
  let service: ReportsApiService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:7102/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    service = TestBed.inject(ReportsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should download summary report as blob', () => {
    service.getSummaryReport().subscribe((blob) => {
      expect(blob).toBeInstanceOf(Blob);
    });

    const req = httpTesting.expectOne(`${baseUrl}api/reports/summary`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf-content'], { type: 'application/pdf' }));
  });

  it('should download tour report as blob', () => {
    service.getTourReport('tour-1').subscribe((blob) => {
      expect(blob).toBeInstanceOf(Blob);
    });

    const req = httpTesting.expectOne(`${baseUrl}api/reports/tour/tour-1`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf-content']));
  });

  it('should export tour as text', () => {
    service.exportTour('tour-1').subscribe((json) => {
      expect(json).toContain('City Walk');
    });

    const req = httpTesting.expectOne(`${baseUrl}api/reports/export/tour-1`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('text');
    req.flush('{"name":"City Walk"}');
  });

  it('should import tour with json body', () => {
    const json = '{"name":"Imported Tour"}';

    service.importTour(json).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}api/reports/import`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(json);
    req.flush({ id: 'new-id', name: 'Imported Tour' });
  });
});
