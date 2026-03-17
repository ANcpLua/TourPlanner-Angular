import { TestBed } from '@angular/core/testing';
import { TourLogListComponent } from './tour-log-list.component';
import { TourLog } from '../models/tour-log.model';

describe('TourLogListComponent', () => {
  const sampleLogs: TourLog[] = [
    {
      id: 'log-1',
      tourId: 'tour-1',
      dateTime: '2026-03-15T10:00:00Z',
      comment: 'Nice walk',
      difficulty: 2,
      totalDistance: 5000,
      totalTime: 1.5,
      rating: 4,
    },
    {
      id: 'log-2',
      tourId: 'tour-1',
      dateTime: '2026-03-16T14:00:00Z',
      comment: 'Tough climb',
      difficulty: 5,
      totalDistance: 12000,
      totalTime: 6,
      rating: 3,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourLogListComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TourLogListComponent);
    fixture.componentRef.setInput('logs', []);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show empty state when no logs', () => {
    const fixture = TestBed.createComponent(TourLogListComponent);
    fixture.componentRef.setInput('logs', []);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state')).not.toBeNull();
    expect(el.textContent).toContain('No logs yet');
  });

  it('should render log cards', () => {
    const fixture = TestBed.createComponent(TourLogListComponent);
    fixture.componentRef.setInput('logs', sampleLogs);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.log-card');
    expect(cards).toHaveLength(2);
    expect(el.textContent).toContain('Nice walk');
    expect(el.textContent).toContain('Tough climb');
  });

  it('should emit editLog on edit button click', () => {
    const fixture = TestBed.createComponent(TourLogListComponent);
    fixture.componentRef.setInput('logs', sampleLogs);
    fixture.detectChanges();

    let emitted: TourLog | null = null;
    fixture.componentInstance.editLog.subscribe((log: TourLog) => (emitted = log));

    const editBtn = fixture.nativeElement.querySelector('.log-card__actions button');
    editBtn.click();

    expect(emitted).not.toBeNull();
    expect(emitted!.id).toBe('log-1');
  });

  it('should emit deleteLog on delete button click', () => {
    const fixture = TestBed.createComponent(TourLogListComponent);
    fixture.componentRef.setInput('logs', sampleLogs);
    fixture.detectChanges();

    let emitted: TourLog | null = null;
    fixture.componentInstance.deleteLog.subscribe((log: TourLog) => (emitted = log));

    const deleteBtn = fixture.nativeElement.querySelector('.log-card__actions .danger');
    deleteBtn.click();

    expect(emitted).not.toBeNull();
    expect(emitted!.id).toBe('log-1');
  });
});
