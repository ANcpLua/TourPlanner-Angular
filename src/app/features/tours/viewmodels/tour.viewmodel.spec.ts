import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { TourViewModel } from './tour.viewmodel';
import { Tour } from '../models/tour.model';

describe('TourViewModel', () => {
  let vm: TourViewModel;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:7102/';

  const sampleTour: Tour = {
    id: 'tour-1',
    name: 'City Walk',
    description: 'A walk',
    from: 'Vienna',
    to: 'Berlin',
    transportType: 'Car',
    distance: 680000,
    estimatedTime: 420,
    routeInformation: JSON.stringify({
      FromCoordinates: { Latitude: 48.2082, Longitude: 16.3738 },
      ToCoordinates: { Latitude: 52.52, Longitude: 13.405 },
    }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    vm = TestBed.inject(TourViewModel);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should start with empty state', () => {
    expect(vm.tours()).toEqual([]);
    expect(vm.selectedTourId()).toBeNull();
    expect(vm.isLoading()).toBe(false);
    expect(vm.isFormVisible()).toBe(false);
  });

  it('should load tours and auto-select first', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([sampleTour]);
    await promise;

    expect(vm.tours()).toHaveLength(1);
    expect(vm.selectedTourId()).toBe('tour-1');
    expect(vm.isLoading()).toBe(false);
  });

  it('should set error on load failure', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.errorMessage()).toBeTruthy();
  });

  it('should select tour', () => {
    vm.selectTour(sampleTour);
    expect(vm.selectedTourId()).toBe('tour-1');
  });

  it('should compute selectedTour from tours', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([sampleTour]);
    await promise;

    expect(vm.selectedTour()?.name).toBe('City Walk');
  });

  it('should compute map coordinates from route information', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([sampleTour]);
    await promise;

    const coords = vm.mapCoordinates();
    expect(coords).not.toBeNull();
    expect(coords!.fromLat).toBe(48.2082);
    expect(coords!.toLat).toBe(52.52);
  });

  it('should open and close create form', () => {
    vm.openCreateForm();
    expect(vm.isFormVisible()).toBe(true);
    expect(vm.editingTourId()).toBeNull();

    vm.closeForm();
    expect(vm.isFormVisible()).toBe(false);
  });

  it('should open edit form with tour selected', () => {
    vm.openEditForm(sampleTour);
    expect(vm.isFormVisible()).toBe(true);
    expect(vm.editingTourId()).toBe('tour-1');
    expect(vm.selectedTourId()).toBe('tour-1');
  });

  it('should pass through backend-computed properties', async () => {
    const tourWithComputedFields: Tour = {
      ...sampleTour,
      popularity: 'Moderately popular',
      averageRating: 4.5,
      isChildFriendly: true,
    };

    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([tourWithComputedFields]);
    await promise;

    const view = vm.tours()[0];
    expect(view.popularity).toBe('Moderately popular');
    expect(view.averageRating).toBe(4.5);
    expect(view.isChildFriendly).toBe(true);
  });

  it('should pass through backend-computed properties when absent', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([sampleTour]);
    await promise;

    const view = vm.tours()[0];
    expect(view.popularity).toBeUndefined();
    expect(view.averageRating).toBeUndefined();
    expect(view.isChildFriendly).toBeUndefined();
  });
});
