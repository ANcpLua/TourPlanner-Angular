import { TestBed } from '@angular/core/testing';
import { TourFormComponent } from './tour-form.component';
import { Tour, TourFormValue } from '../models/tour.model';

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

  it('should emit saveTour on valid submit', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls['name'].setValue('My Tour');
    form.controls['description'].setValue('A nice tour');
    form.controls['from'].setValue('Vienna');
    form.controls['to'].setValue('Berlin');
    form.controls['transportType'].setValue('Car');

    let emittedValue: TourFormValue | undefined;
    fixture.componentInstance.saveTour.subscribe((v: TourFormValue) => (emittedValue = v));

    fixture.componentInstance['submit']();

    expect(emittedValue).toBeDefined();
    expect(emittedValue!.name).toBe('My Tour');
    expect(emittedValue!.from).toBe('Vienna');
    expect(emittedValue!.to).toBe('Berlin');
  });

  it('should not emit saveTour and mark touched on invalid submit', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.saveTour.subscribe(() => (emitted = true));

    // Leave form empty (invalid)
    fixture.componentInstance['submit']();

    expect(emitted).toBe(false);
    expect(fixture.componentInstance['form'].touched).toBe(true);
  });

  it('should render name required error in template when name is empty and touched', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls['name'].setValue('');
    form.controls['name'].markAsTouched();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const small = el.querySelector('small');
    expect(small).not.toBeNull();
    expect(small!.textContent).toContain('Name is required.');
  });

  it('should render description required error in template when description is empty and touched', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls['description'].setValue('');
    form.controls['description'].markAsTouched();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const smalls = el.querySelectorAll('small');
    const descError = Array.from(smalls).find((s) => s.textContent?.includes('Description is required.'));
    expect(descError).toBeDefined();
  });

  it('should render from required error in template when from is empty and touched', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls['from'].setValue('');
    form.controls['from'].markAsTouched();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const smalls = el.querySelectorAll('small');
    const fromError = Array.from(smalls).find((s) => s.textContent?.includes('Start city is required.'));
    expect(fromError).toBeDefined();
  });

  it('should render to required error in template when to is empty and touched', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls['to'].setValue('');
    form.controls['to'].markAsTouched();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const smalls = el.querySelectorAll('small');
    const toError = Array.from(smalls).find((s) => s.textContent?.includes('Destination city is required.'));
    expect(toError).toBeDefined();
  });

  it('should show "Saving…" when submitting is true', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.textContent).toContain('Saving');
  });

  it('should disable submit button when submitting is true', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls['name'].setValue('My Tour');
    form.controls['description'].setValue('A nice tour');
    form.controls['from'].setValue('Vienna');
    form.controls['to'].setValue('Berlin');
    form.controls['transportType'].setValue('Car');

    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('should render identicalCities error message in template', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls['from'].setValue('Vienna');
    form.controls['to'].setValue('Vienna');
    form.markAsDirty();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const errorP = el.querySelector('.tour-form__error');
    expect(errorP).not.toBeNull();
    expect(errorP!.textContent).toContain('Start and destination must be different.');
  });

  describe('resetFormEffect', () => {
    const tourA: Tour = {
      id: 'tour-a',
      name: 'Tour A',
      description: 'Desc A',
      from: 'Vienna',
      to: 'Berlin',
      transportType: 'Car',
    } as Tour;

    const tourB: Tour = {
      id: 'tour-b',
      name: 'Tour B',
      description: 'Desc B',
      from: 'Paris',
      to: 'Budapest',
      transportType: 'Bike',
    } as Tour;

    it('should populate form fields when tour input is set', () => {
      const fixture = TestBed.createComponent(TourFormComponent);
      fixture.componentRef.setInput('tour', tourA);
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      expect(form.controls['id'].value).toBe('tour-a');
      expect(form.controls['name'].value).toBe('Tour A');
      expect(form.controls['description'].value).toBe('Desc A');
      expect(form.controls['from'].value).toBe('Vienna');
      expect(form.controls['to'].value).toBe('Berlin');
      expect(form.controls['transportType'].value).toBe('Car');
    });

    it('should update form fields when tour input changes to a different tour', () => {
      const fixture = TestBed.createComponent(TourFormComponent);
      fixture.componentRef.setInput('tour', tourA);
      fixture.detectChanges();

      fixture.componentRef.setInput('tour', tourB);
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      expect(form.controls['id'].value).toBe('tour-b');
      expect(form.controls['name'].value).toBe('Tour B');
      expect(form.controls['description'].value).toBe('Desc B');
      expect(form.controls['from'].value).toBe('Paris');
      expect(form.controls['to'].value).toBe('Budapest');
      expect(form.controls['transportType'].value).toBe('Bike');
    });

    it('should reset form to empty values when tour input is removed', () => {
      const fixture = TestBed.createComponent(TourFormComponent);
      fixture.componentRef.setInput('tour', tourA);
      fixture.detectChanges();

      // Verify form was populated first
      expect(fixture.componentInstance['form'].controls['name'].value).toBe('Tour A');

      fixture.componentRef.setInput('tour', null);
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      expect(form.controls['id'].value).toBeNull();
      expect(form.controls['name'].value).toBe('');
      expect(form.controls['description'].value).toBe('');
      expect(form.controls['from'].value).toBe('');
      expect(form.controls['to'].value).toBe('');
      expect(form.controls['transportType'].value).toBe('Car');
    });
  });

  it('should show required error for a dirty empty name field', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const nameControl = fixture.componentInstance['form'].controls['name'];
    nameControl.setValue('');
    nameControl.markAsDirty();

    expect(fixture.componentInstance['showRequiredError']('name')).toBe(true);
  });

  it('should return the correct AbstractControl from control()', () => {
    const fixture = TestBed.createComponent(TourFormComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    const result = fixture.componentInstance['control']('name');

    expect(result).toBe(form.controls['name']);
  });
});
