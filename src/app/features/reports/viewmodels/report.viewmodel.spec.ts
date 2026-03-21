import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { ReportViewModel } from './report.viewmodel';

describe('ReportViewModel', () => {
  let vm: ReportViewModel;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:7102/';

  // Anchor element stub used to capture blob download calls.
  let anchorClickSpy: ReturnType<typeof vi.fn>;
  let anchorStub: HTMLAnchorElement;

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

    // Spy on static methods only — replacing the whole URL global would break new URL() in services.
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    // Capture anchor clicks without actually navigating.
    anchorClickSpy = vi.fn();
    anchorStub = { href: '', download: '', click: anchorClickSpy } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchorStub);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.restoreAllMocks();
  });

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

  it('should set error on loadTours failure', async () => {
    const promise = vm.loadTours();
    httpTesting.expectOne(`${baseUrl}api/tour`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.errorMessage()).toBe('Could not load tours.');
  });

  it('should select tour', () => {
    vm.selectTour('tour-1');
    expect(vm.selectedTourId()).toBe('tour-1');
  });

  // generateSummaryReport --------------------------------------------------------

  it('should download blob and set success message on generateSummaryReport', async () => {
    const promise = vm.generateSummaryReport();
    httpTesting.expectOne(`${baseUrl}api/reports/summary`).flush(new Blob(['pdf']));
    await promise;

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(anchorClickSpy).toHaveBeenCalledOnce();
    expect(anchorStub.download).toBe('SummaryReport.pdf');
    expect(vm.successMessage()).toBe('Summary report downloaded.');
    expect(vm.isProcessing()).toBe(false);
  });

  it('should set error on summary report failure', async () => {
    const promise = vm.generateSummaryReport();
    httpTesting.expectOne(`${baseUrl}api/reports/summary`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.errorMessage()).toBeTruthy();
    expect(vm.isProcessing()).toBe(false);
  });

  // generateTourReport -----------------------------------------------------------

  it('should not generate tour report without selection', async () => {
    await vm.generateTourReport();
    expect(vm.isProcessing()).toBe(false);
  });

  it('should download blob and set success message on generateTourReport', async () => {
    vm.selectTour('tour-1');
    const promise = vm.generateTourReport();

    httpTesting.expectOne(`${baseUrl}api/reports/tour/tour-1`).flush(new Blob(['pdf']));
    await promise;

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(anchorClickSpy).toHaveBeenCalledOnce();
    expect(anchorStub.download).toBe('TourReport_tour-1.pdf');
    expect(vm.successMessage()).toBe('Tour report downloaded.');
    expect(vm.errorMessage()).toBeNull();
    expect(vm.isProcessing()).toBe(false);
  });

  it('should set error on tour report failure', async () => {
    vm.selectTour('tour-1');
    const promise = vm.generateTourReport();

    httpTesting.expectOne(`${baseUrl}api/reports/tour/tour-1`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.errorMessage()).toBe('Could not generate tour report.');
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

  // exportTour -------------------------------------------------------------------

  it('should not export without selection', async () => {
    await vm.exportTour();
    expect(vm.isProcessing()).toBe(false);
  });

  it('should download JSON blob and set success message on exportTour', async () => {
    vm.selectTour('tour-1');
    const promise = vm.exportTour();

    httpTesting
      .expectOne(`${baseUrl}api/reports/export/tour-1`)
      .flush('{"id":"tour-1"}', { headers: { 'Content-Type': 'text/plain' } });
    await promise;

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(anchorClickSpy).toHaveBeenCalledOnce();
    expect(anchorStub.download).toBe('TourExport_tour-1.json');
    expect(vm.successMessage()).toBe('Tour exported.');
    expect(vm.isProcessing()).toBe(false);
  });

  it('should set error on export failure', async () => {
    vm.selectTour('tour-1');
    const promise = vm.exportTour();

    httpTesting.expectOne(`${baseUrl}api/reports/export/tour-1`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.errorMessage()).toBe('Could not export tour.');
    expect(vm.isProcessing()).toBe(false);
  });

  // importTour -------------------------------------------------------------------

  it('should import file, reload tours, and set success message', async () => {
    const file = { text: vi.fn().mockResolvedValue('{"id":"tour-1"}') } as unknown as File;
    const promise = vm.importTour(file);

    // Drain the file.text() microtask so the POST is queued.
    await file.text();
    httpTesting.expectOne(r => r.method === 'POST' && r.url.includes('api/reports/import')).flush({ id: 'tour-2', name: 'Imported' });

    // Drain the microtask that fires loadTours() after the POST resolves.
    await Promise.resolve();
    httpTesting.expectOne(`${baseUrl}api/tour`).flush([{ id: 'tour-2', name: 'Imported' }]);
    await promise;

    expect(vm.successMessage()).toBe('Tour imported successfully.');
    expect(vm.tours()).toHaveLength(1);
    expect(vm.isProcessing()).toBe(false);
  });

  it('should set error on import failure', async () => {
    const file = { text: vi.fn().mockResolvedValue('bad json') } as unknown as File;
    const promise = vm.importTour(file);

    await file.text();

    httpTesting.expectOne(r => r.method === 'POST' && r.url.includes('api/reports/import')).error(new ProgressEvent('error'));
    await promise;

    expect(vm.errorMessage()).toBe('Could not import tour. Check the file format.');
    expect(vm.isProcessing()).toBe(false);
  });
});
