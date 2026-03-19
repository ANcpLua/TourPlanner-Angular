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

  it('should select tour and load logs', async () => {
    const promise = vm.selectTour('tour-1');
    httpTesting.expectOne(`${baseUrl}api/tourlog/bytour/tour-1`).flush([sampleLog]);
    await promise;

    expect(vm.selectedTourId()).toBe('tour-1');
    expect(vm.logs()).toHaveLength(1);
    expect(vm.isFormVisible()).toBe(false);
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
});
