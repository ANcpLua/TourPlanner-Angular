import { TestBed } from '@angular/core/testing';
import { TourFormComponent } from './tour-form.component';
import { Tour } from '../models/tour.model';

describe('TourFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourFormComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show "Create Tour" for new tour', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Create Tour');
  });

  it('should show "Edit Tour" when tour input is provided', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.componentRef.setInput('tour', {
      id: 'tour-1',
      name: 'Test',
      description: 'Desc',
      from: 'Vienna',
      to: 'Berlin',
      transportType: 'Car',
    } as Tour);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Edit Tour');
  });

  it('should not emit saveTour when form is invalid', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.saveTour.subscribe(() => (emitted = true));

    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
    submitBtn.click();

    expect(emitted).toBe(false);
  });

  it('should emit cancel', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => (cancelled = true));

    const cancelBtn = fixture.nativeElement.querySelector('.tour-form__secondary');
    cancelBtn.click();

    expect(cancelled).toBe(true);
  });

  it('should render city options', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('select[formControlName="from"] option');
    expect(options.length).toBeGreaterThan(1);
    const cityNames = Array.from(options).map((o: unknown) => (o as HTMLOptionElement).textContent?.trim());
    expect(cityNames).toContain('Vienna');
    expect(cityNames).toContain('Berlin');
  });
});
