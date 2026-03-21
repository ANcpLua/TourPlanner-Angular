import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { TourLogViewModel } from './tour-log.viewmodel';
import { TourLog } from '../models/tour-log.model';

describe('TourLogViewModel', () => {
  let vm: TourLogViewModel;
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

    vm = TestBed.inject(TourLogViewModel);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should start with empty state', () => {
    expect(vm.tours()).toEqual([]);
    expect(vm.logs()).toEqual([]);
    expect(vm.selectedTourId()).toBeNull();
    expect(vm.isFormVisible()).toBe(false);
  });

  it('should load tours', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([{ id: 'tour-1', name: 'Test' }]);
    await promise;

    expect(vm.tours()).toHaveLength(1);
  });

  it('should set error on loadTours failure', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.errorMessage()).toBe('Could not load tours.');
  });

  it('should select tour and load logs', async () => {
    const promise = vm.selectTour('tour-1');
    httpTesting.expectOne(`${baseUrl}api/tourlog/bytour/tour-1`).flush([sampleLog]);
    await promise;

    expect(vm.selectedTourId()).toBe('tour-1');
    expect(vm.logs()).toHaveLength(1);
    expect(vm.isFormVisible()).toBe(false);
  });

  it('should set error on loadLogs failure', async () => {
    const promise = vm.selectTour('tour-1');
    httpTesting.expectOne(`${baseUrl}api/tourlog/bytour/tour-1`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.errorMessage()).toBe('Could not load tour logs.');
  });

  it('should return early without HTTP call when selectedTourId is null', async () => {
    await vm.loadLogs();

    httpTesting.expectNone(`${baseUrl}api/tourlog/bytour/`);
    expect(vm.isLoading()).toBe(false);
  });

  it('should clear logs when tour deselected', async () => {
    await vm.selectTour(null);

    expect(vm.selectedTourId()).toBeNull();
    expect(vm.logs()).toEqual([]);
  });

  it('should open and close form', () => {
    vm.openCreateForm();
    expect(vm.isFormVisible()).toBe(true);
    expect(vm.editingLogId()).toBeNull();

    vm.closeForm();
    expect(vm.isFormVisible()).toBe(false);
  });

  it('should open edit form', () => {
    vm.openEditForm(sampleLog);
    expect(vm.isFormVisible()).toBe(true);
    expect(vm.editingLogId()).toBe('log-1');
  });

  it('should compute editingLog', async () => {
    const selectPromise = vm.selectTour('tour-1');
    httpTesting.expectOne(`${baseUrl}api/tourlog/bytour/tour-1`).flush([sampleLog]);
    await selectPromise;

    vm.openEditForm(sampleLog);
    expect(vm.editingLog()?.comment).toBe('Nice walk');
  });

  describe('saveLog', () => {
    // Two Promise.resolve() ticks needed: one for RxJS take(1) completion,
    // one for firstValueFrom's internal promise to resolve and schedule the next HTTP call.
    const tick = () => Promise.resolve().then(() => Promise.resolve());

    const createFormValue: import('../models/tour-log.model').TourLogFormValue = {
      id: null,
      tourId: 'tour-1',
      comment: 'Great hike',
      difficulty: 3,
      totalDistance: 8000,
      totalTime: 2.5,
      rating: 5,
    };

    const createdLog: TourLog = {
      ...sampleLog,
      id: 'log-new',
      comment: 'Great hike',
    };

    // Select a tour first so loadLogs (called after save) knows which tour to use
    async function selectTour(): Promise<void> {
      const p = vm.selectTour('tour-1');
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tourlog/bytour/tour-1` }).flush([sampleLog]);
      await p;
    }

    it('should create log when no id, reload logs and close form', async () => {
      await selectTour();
      vm.openCreateForm();

      const promise = vm.saveLog(createFormValue);

      await tick();
      httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/tourlog` }).flush(createdLog);
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tourlog/bytour/tour-1` }).flush([createdLog]);
      await promise;

      expect(vm.logs()).toHaveLength(1);
      expect(vm.logs()[0].comment).toBe('Great hike');
      expect(vm.isFormVisible()).toBe(false);
      expect(vm.isSaving()).toBe(false);
    });

    it('should update log when id exists, reload logs and close form', async () => {
      await selectTour();
      vm.openEditForm(sampleLog);

      const updateFormValue: import('../models/tour-log.model').TourLogFormValue = {
        ...createFormValue,
        id: 'log-1',
        comment: 'Updated comment',
      };
      const updatedLog: TourLog = { ...sampleLog, comment: 'Updated comment' };

      const promise = vm.saveLog(updateFormValue);

      await tick();
      httpTesting.expectOne({ method: 'PUT', url: `${baseUrl}api/tourlog/log-1` }).flush(updatedLog);
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tourlog/bytour/tour-1` }).flush([updatedLog]);
      await promise;

      expect(vm.logs()[0].comment).toBe('Updated comment');
      expect(vm.isFormVisible()).toBe(false);
    });

    it('should set error message on save failure', async () => {
      await selectTour();

      const promise = vm.saveLog(createFormValue);

      await tick();
      httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/tourlog` }).error(new ProgressEvent('error'));
      await promise;

      expect(vm.errorMessage()).toBeTruthy();
      expect(vm.isSaving()).toBe(false);
    });
  });

  describe('deleteLog', () => {
    const tick = () => Promise.resolve().then(() => Promise.resolve());

    async function selectTourWithLog(): Promise<void> {
      const p = vm.selectTour('tour-1');
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tourlog/bytour/tour-1` }).flush([sampleLog]);
      await p;
    }

    it('should delete log and reload', async () => {
      await selectTourWithLog();

      const promise = vm.deleteLog(sampleLog);

      await tick();
      httpTesting.expectOne({ method: 'DELETE', url: `${baseUrl}api/tourlog/log-1` }).flush(null);
      await tick();
      httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tourlog/bytour/tour-1` }).flush([]);
      await promise;

      expect(vm.logs()).toHaveLength(0);
      expect(vm.errorMessage()).toBeNull();
    });

    it('should set error message when deleteLog fails', async () => {
      await selectTourWithLog();

      const promise = vm.deleteLog(sampleLog);

      await tick();
      httpTesting.expectOne({ method: 'DELETE', url: `${baseUrl}api/tourlog/log-1` }).error(new ProgressEvent('error'));
      await promise;

      expect(vm.errorMessage()).toBe('Could not delete the log.');
    });
  });
});
