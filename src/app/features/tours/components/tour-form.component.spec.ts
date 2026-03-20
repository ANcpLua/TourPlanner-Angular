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

  it('should show required error for a touched empty name field', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const nameControl = component['form'].controls['name'];
    nameControl.setValue('');
    nameControl.markAsTouched();

    expect(component['showRequiredError']('name')).toBe(true);
  });

  it('should not show required error for an untouched empty name field', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    // name is empty by default and untouched — error should be hidden
    expect(component['showRequiredError']('name')).toBe(false);
  });

  it('should show identicalCities error on the form when from equals to', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls['from'].setValue('Vienna');
    form.controls['to'].setValue('Vienna');

    expect(form.hasError('identicalCities')).toBe(true);
  });

  it('should not show identicalCities error when from and to differ', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls['from'].setValue('Vienna');
    form.controls['to'].setValue('Berlin');

    expect(form.hasError('identicalCities')).toBe(false);
  });
});
