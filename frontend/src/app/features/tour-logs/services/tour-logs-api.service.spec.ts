import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { TourLogsApiService } from './tour-logs-api.service';
import { TourLog } from '../models/tour-log.model';

describe('TourLogsApiService', () => {
  let service: TourLogsApiService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:7102/';

  const sampleLog: TourLog = {
    id: 'log-1',
    tourId: 'tour-1',
    dateTime: '2026-03-15T10:00:00Z',
    comment: 'Nice walk',
    difficulty: 2,
    totalDistance: 5000,
    totalTime: 1.5,
    rating: 4,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    service = TestBed.inject(TourLogsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should fetch logs by tour id', () => {
    service.getLogsByTour('tour-1').subscribe((logs) => {
      expect(logs).toHaveLength(1);
      expect(logs[0].comment).toBe('Nice walk');
    });

    const req = httpTesting.expectOne(`${baseUrl}api/tourlog/bytour/tour-1`);
    expect(req.request.method).toBe('GET');
    req.flush([sampleLog]);
  });

  it('should create a log', () => {
    service.createLog(sampleLog).subscribe((log) => {
      expect(log.id).toBe('log-1');
    });

    const req = httpTesting.expectOne(`${baseUrl}api/tourlog`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(sampleLog);
    req.flush(sampleLog);
  });

  it('should update a log', () => {
    service.updateLog(sampleLog).subscribe((log) => {
      expect(log.comment).toBe('Nice walk');
    });

    const req = httpTesting.expectOne(`${baseUrl}api/tourlog/log-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(sampleLog);
  });

  it('should delete a log', () => {
    service.deleteLog('log-1').subscribe();

    const req = httpTesting.expectOne(`${baseUrl}api/tourlog/log-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
