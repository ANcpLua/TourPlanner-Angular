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

  it('should load tours with empty array', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([]);
    await promise;

    expect(vm.tours()).toEqual([]);
    expect(vm.selectedTourId()).toBeNull();
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

  describe('saveTour', () => {
    const formValue: import('../models/tour.model').TourFormValue = {
      id: null,
      name: 'New Tour',
      description: 'A new tour',
      from: 'Vienna',
      to: 'Berlin',
      transportType: 'Car',
    };

    const routeResponse = { distance: 680000, duration: 420 };

    const createdTour: Tour = {
      ...sampleTour,
      id: 'tour-new',
      name: 'New Tour',
    };

    // Helper: drain the microtask queue enough for RxJS firstValueFrom chains
    // to advance past a completed HTTP observable to the next HTTP call.
    // Two Promise.resolve() ticks are needed: one for RxJS to call observer.complete()
    // through take(1), and one for firstValueFrom's internal promise to resolve.
    const tick = () => Promise.resolve().then(() => Promise.resolve());

    it('should create tour when no id, reload tours and close form', async () => {
      vm.openCreateForm();

      const promise = vm.saveTour(formValue);

      await tick();
      httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/routes/resolve` }).flush(routeResponse);
      await tick();
      httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/tour` }).flush(createdTour);
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([createdTour]);
      await promise;

      expect(vm.tours()).toHaveLength(1);
      expect(vm.selectedTourId()).toBe('tour-new');
      expect(vm.isFormVisible()).toBe(false);
      expect(vm.isSaving()).toBe(false);
    });

    it('should update tour when id exists, reload tours and close form', async () => {
      const updateFormValue: import('../models/tour.model').TourFormValue = {
        ...formValue,
        id: 'tour-1',
        name: 'Updated Tour',
      };
      const updatedTour: Tour = { ...sampleTour, name: 'Updated Tour' };

      vm.openEditForm(sampleTour);

      const promise = vm.saveTour(updateFormValue);

      await tick();
      httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/routes/resolve` }).flush(routeResponse);
      await tick();
      httpTesting.expectOne({ method: 'PUT', url: `${baseUrl}api/tour/tour-1` }).flush(updatedTour);
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([updatedTour]);
      await promise;

      expect(vm.tours()).toHaveLength(1);
      expect(vm.isFormVisible()).toBe(false);
    });

    it('should set error message on save failure', async () => {
      const promise = vm.saveTour(formValue);

      await tick();
      httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/routes/resolve` }).error(new ProgressEvent('error'));
      await promise;

      expect(vm.errorMessage()).toBeTruthy();
      expect(vm.isSaving()).toBe(false);
    });

    it('should set isSaving to true during save and false after', async () => {
      expect(vm.isSaving()).toBe(false);

      const promise = vm.saveTour(formValue);

      // isSaving is set synchronously before any await inside saveTour
      expect(vm.isSaving()).toBe(true);

      await tick();
      httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/routes/resolve` }).flush(routeResponse);
      await tick();
      httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/tour` }).flush(createdTour);
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([createdTour]);
      await promise;

      expect(vm.isSaving()).toBe(false);
    });
  });

  describe('deleteTour', () => {
    const tick = () => Promise.resolve().then(() => Promise.resolve());

    it('should delete tour and reload', async () => {
      // Pre-load so there is something in the list to reload
      const loadPromise = vm.loadTours();
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([sampleTour]);
      await loadPromise;

      const promise = vm.deleteTour(sampleTour);

      await tick();
      httpTesting.expectOne({ method: 'DELETE', url: `${baseUrl}api/tour/tour-1` }).flush(null);
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([]);
      await promise;

      expect(vm.tours()).toHaveLength(0);
      expect(vm.errorMessage()).toBeNull();
    });

    it('should set error message when deleteTour fails', async () => {
      const promise = vm.deleteTour(sampleTour);

      await tick();
      httpTesting.expectOne({ method: 'DELETE', url: `${baseUrl}api/tour/tour-1` }).error(new ProgressEvent('error'));
      await promise;

      expect(vm.errorMessage()).toBe('Could not delete the selected tour.');
    });

    it('should reset selectedTourId when deleting the selected tour', async () => {
      const secondTour: Tour = { ...sampleTour, id: 'tour-2', name: 'Second Tour' };

      // Pre-load two tours
      const loadPromise = vm.loadTours();
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([sampleTour, secondTour]);
      await loadPromise;

      expect(vm.selectedTourId()).toBe('tour-1');

      const promise = vm.deleteTour(sampleTour);

      await tick();
      httpTesting.expectOne({ method: 'DELETE', url: `${baseUrl}api/tour/tour-1` }).flush(null);
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([secondTour]);
      await promise;

      expect(vm.selectedTourId()).toBe('tour-2');
    });

    it('should not change selectedTourId when deleting a non-selected tour', async () => {
      const secondTour: Tour = { ...sampleTour, id: 'tour-2', name: 'Second Tour' };

      // Pre-load two tours
      const loadPromise = vm.loadTours();
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([sampleTour, secondTour]);
      await loadPromise;

      expect(vm.selectedTourId()).toBe('tour-1');

      const promise = vm.deleteTour(secondTour);

      await tick();
      httpTesting.expectOne({ method: 'DELETE', url: `${baseUrl}api/tour/tour-2` }).flush(null);
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([sampleTour]);
      await promise;

      expect(vm.selectedTourId()).toBe('tour-1');
    });
  });

  it('should return editingTour when editingTourId matches a loaded tour', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([sampleTour]);
    await promise;

    vm.openEditForm(sampleTour);

    expect(vm.editingTour()).not.toBeNull();
    expect(vm.editingTour()!.id).toBe('tour-1');
    expect(vm.editingTour()!.name).toBe('City Walk');
  });

  it('should return null editingTour when editingTourId is null', () => {
    expect(vm.editingTour()).toBeNull();
  });

  it('should return null mapCoordinates when routeInformation is invalid JSON', async () => {
    const tourWithBadJson: Tour = {
      ...sampleTour,
      routeInformation: 'not-valid-json{{{',
    };

    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([tourWithBadJson]);
    await promise;

    expect(vm.selectedTour()).not.toBeNull();
    expect(vm.mapCoordinates()).toBeNull();
  });

  it('should return null mapCoordinates when routeInformation is missing', async () => {
    const tourNoRoute: Tour = {
      ...sampleTour,
      routeInformation: undefined,
    };

    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([tourNoRoute]);
    await promise;

    expect(vm.mapCoordinates()).toBeNull();
  });
});
