import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReportViewModel } from '../viewmodels/report.viewmodel';
import { ReportsPageComponent } from './reports-page.component';
import { Tour } from '../../tours/models/tour.model';

describe('ReportsPageComponent', () => {
  const sampleTours: Tour[] = [
    {
      id: 'tour-1',
      name: 'Vienna to Salzburg',
      description: 'Highway route',
      from: 'Vienna',
      to: 'Salzburg',
      transportType: 'Car',
    },
    {
      id: 'tour-2',
      name: 'Graz to Linz',
      description: 'Scenic route',
      from: 'Graz',
      to: 'Linz',
      transportType: 'Bike',
    },
  ];

  let loadToursMock: ReturnType<typeof vi.fn>;
  let selectTourMock: ReturnType<typeof vi.fn>;
  let generateSummaryReportMock: ReturnType<typeof vi.fn>;
  let generateTourReportMock: ReturnType<typeof vi.fn>;
  let exportTourMock: ReturnType<typeof vi.fn>;
  let importTourMock: ReturnType<typeof vi.fn>;
  let toursSig: ReturnType<typeof signal<readonly Tour[]>>;
  let selectedTourIdSig: ReturnType<typeof signal<string | null>>;
  let isProcessingSig: ReturnType<typeof signal<boolean>>;
  let errorMessageSig: ReturnType<typeof signal<string | null>>;
  let successMessageSig: ReturnType<typeof signal<string | null>>;

  beforeEach(async () => {
    loadToursMock = vi.fn().mockResolvedValue(undefined);
    selectTourMock = vi.fn();
    generateSummaryReportMock = vi.fn().mockResolvedValue(undefined);
    generateTourReportMock = vi.fn().mockResolvedValue(undefined);
    exportTourMock = vi.fn().mockResolvedValue(undefined);
    importTourMock = vi.fn().mockResolvedValue(undefined);

    toursSig = signal<readonly Tour[]>(sampleTours);
    selectedTourIdSig = signal<string | null>(null);
    isProcessingSig = signal(false);
    errorMessageSig = signal<string | null>(null);
    successMessageSig = signal<string | null>(null);

    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent],
      providers: [
        {
          provide: ReportViewModel,
          useValue: {
            tours: toursSig,
            selectedTourId: selectedTourIdSig,
            isProcessing: isProcessingSig,
            errorMessage: errorMessageSig,
            successMessage: successMessageSig,
            loadTours: loadToursMock,
            selectTour: selectTourMock,
            generateSummaryReport: generateSummaryReportMock,
            generateTourReport: generateTourReportMock,
            exportTour: exportTourMock,
            importTour: importTourMock,
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call vm.loadTours on init', async () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    await fixture.componentInstance.ngOnInit();

    expect(loadToursMock).toHaveBeenCalledOnce();
  });

  it('should render the tour select dropdown with options', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select).toBeTruthy();

    const options = select.querySelectorAll('option');
    // placeholder + 2 tours
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toContain('Choose a tour');
    expect(options[1].textContent).toContain('Vienna to Salzburg');
    expect(options[2].textContent).toContain('Graz to Linz');
  });

  it('should render action buttons', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const labels = Array.from(buttons).map((b) => b.textContent!.trim());

    expect(labels).toContain('Download Summary PDF');
    expect(labels).toContain('Download Tour PDF');
    expect(labels).toContain('Export as JSON');
  });

  it('should call vm.selectTour when a tour is selected from dropdown', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'tour-1';
    select.dispatchEvent(new Event('change'));

    expect(selectTourMock).toHaveBeenCalledOnce();
    expect(selectTourMock).toHaveBeenCalledWith('tour-1');
  });

  it('should call vm.selectTour with null when placeholder is selected', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(selectTourMock).toHaveBeenCalledOnce();
    expect(selectTourMock).toHaveBeenCalledWith(null);
  });

  it('should display error message when errorMessage signal is set', () => {
    errorMessageSig.set('Something went wrong');

    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.reports-page__error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Something went wrong');
  });

  it('should display success message when successMessage signal is set', () => {
    successMessageSig.set('Report downloaded.');

    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const successEl = fixture.nativeElement.querySelector('.reports-page__success');
    expect(successEl).toBeTruthy();
    expect(successEl.textContent).toContain('Report downloaded.');
  });

  it('should not display error or success messages when signals are null', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.reports-page__error')).toBeNull();
    expect(fixture.nativeElement.querySelector('.reports-page__success')).toBeNull();
  });

  it('should disable tour-specific buttons when no tour is selected', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const tourPdfBtn = Array.from(buttons).find((b) => b.textContent!.includes('Download Tour PDF'))!;
    const exportBtn = Array.from(buttons).find((b) => b.textContent!.includes('Export as JSON'))!;

    expect(tourPdfBtn.disabled).toBe(true);
    expect(exportBtn.disabled).toBe(true);
  });

  it('should enable tour-specific buttons when a tour is selected', () => {
    selectedTourIdSig.set('tour-1');

    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const tourPdfBtn = Array.from(buttons).find((b) => b.textContent!.includes('Download Tour PDF'))!;
    const exportBtn = Array.from(buttons).find((b) => b.textContent!.includes('Export as JSON'))!;

    expect(tourPdfBtn.disabled).toBe(false);
    expect(exportBtn.disabled).toBe(false);
  });

  it('should show processing text on summary button when isProcessing is true', () => {
    isProcessingSig.set(true);

    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const summaryBtn = Array.from(buttons).find((b) => b.textContent!.includes('Generating'))!;

    expect(summaryBtn).toBeTruthy();
  });

  it('should call vm.importTour when a file is selected', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const file = new File(['{}'], 'tour.json', { type: 'application/json' });
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    // jsdom lacks DataTransfer — set files via defineProperty
    Object.defineProperty(input, 'files', { value: [file], writable: true });
    input.dispatchEvent(new Event('change'));

    expect(importTourMock).toHaveBeenCalledOnce();
    expect(importTourMock).toHaveBeenCalledWith(file);
  });

  it('should not call vm.importTour when no file is provided', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    input.dispatchEvent(new Event('change'));

    expect(importTourMock).not.toHaveBeenCalled();
  });

  it('should reset file input value after file selection', () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    const file = new File(['{}'], 'tour.json', { type: 'application/json' });
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', { value: [file], writable: true });
    input.dispatchEvent(new Event('change'));

    expect(input.value).toBe('');
  });
});
