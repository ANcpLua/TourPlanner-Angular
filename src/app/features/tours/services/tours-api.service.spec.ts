import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { ToursApiService } from './tours-api.service';
import { Tour } from '../models/tour.model';

describe('ToursApiService', () => {
  let service: ToursApiService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:7102/';

  const sampleTour: Tour = {
    id: 'tour-1',
    name: 'City Walk',
    description: 'A walk through the city',
    from: 'Vienna',
    to: 'Berlin',
    transportType: 'Car',
    distance: 680000,
    estimatedTime: 420,
    imagePath: 'Images/tours/ViennaBerlin.png',
    routeInformation: '{}',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    service = TestBed.inject(ToursApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should fetch all tours', () => {
    service.getTours().subscribe((tours) => {
      expect(tours).toHaveLength(1);
      expect(tours[0].name).toBe('City Walk');
    });

    const req = httpTesting.expectOne(`${baseUrl}api/tour`);
    expect(req.request.method).toBe('GET');
    req.flush([sampleTour]);
  });

  it('should create a tour', () => {
    service.createTour(sampleTour).subscribe((tour) => {
      expect(tour.name).toBe('City Walk');
    });

    const req = httpTesting.expectOne(`${baseUrl}api/tour`);
    expect(req.request.method).toBe('POST');
    req.flush(sampleTour);
  });

  it('should update a tour', () => {
    service.updateTour(sampleTour).subscribe((tour) => {
      expect(tour.id).toBe('tour-1');
    });

    const req = httpTesting.expectOne(`${baseUrl}api/tour/tour-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(sampleTour);
  });

  it('should delete a tour', () => {
    service.deleteTour('tour-1').subscribe();

    const req = httpTesting.expectOne(`${baseUrl}api/tour/tour-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should search tours', () => {
    service.searchTours('Vienna').subscribe((tours) => {
      expect(tours).toHaveLength(1);
    });

    const req = httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`);
    expect(req.request.method).toBe('GET');
    req.flush([sampleTour]);
  });

  it('should encode search text', () => {
    service.searchTours('city walk').subscribe();

    const req = httpTesting.expectOne(`${baseUrl}api/tour/search/city%20walk`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should resolve route', () => {
    const request = {
      fromLatitude: 48.2082,
      fromLongitude: 16.3738,
      toLatitude: 52.52,
      toLongitude: 13.405,
      transportType: 'Car',
    };

    service.resolveRoute(request).subscribe((response) => {
      expect(response.distance).toBe(680000);
    });

    const req = httpTesting.expectOne(`${baseUrl}api/routes/resolve`);
    expect(req.request.method).toBe('POST');
    req.flush({ distance: 680000, duration: 420 });
  });
});
