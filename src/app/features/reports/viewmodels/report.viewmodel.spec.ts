import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { ReportViewModel } from './report.viewmodel';

describe('ReportViewModel', () => {
  let vm: ReportViewModel;
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

    vm = TestBed.inject(ReportViewModel);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should start with empty state', () => {
    expect(vm.tours()).toEqual([]);
    expect(vm.selectedTourId()).toBeNull();
    expect(vm.isProcessing()).toBe(false);
  });

  it('should load tours', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([{ id: 'tour-1', name: 'Test' }]);
    await promise;

    expect(vm.tours()).toHaveLength(1);
  });

  it('should select tour', () => {
    vm.selectTour('tour-1');
    expect(vm.selectedTourId()).toBe('tour-1');
  });

  it('should set error on summary report failure', async () => {
    const promise = vm.generateSummaryReport();
    httpTesting.expectOne(`${baseUrl}api/reports/summary`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.errorMessage()).toBeTruthy();
    expect(vm.isProcessing()).toBe(false);
  });

  it('should not generate tour report without selection', async () => {
    await vm.generateTourReport();
    expect(vm.isProcessing()).toBe(false);
  });

  it('should not export without selection', async () => {
    await vm.exportTour();
    expect(vm.isProcessing()).toBe(false);
  });

  it('should clear messages on new operation', async () => {
    vm.selectTour('tour-1');
    const promise = vm.generateTourReport();

    httpTesting
      .expectOne(`${baseUrl}api/reports/tour/tour-1`)
      .flush(new Blob(['pdf']));
    await promise;

    expect(vm.errorMessage()).toBeNull();
  });
});
