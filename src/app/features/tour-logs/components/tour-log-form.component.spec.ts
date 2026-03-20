import { TestBed } from '@angular/core/testing';
import { TourLogFormComponent } from './tour-log-form.component';
import { TourLog, TourLogFormValue } from '../models/tour-log.model';

describe('TourLogFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourLogFormComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show "Create Log" title when no log input', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Create Log');
  });

  it('should show "Edit Log" title when log input is provided', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.componentRef.setInput('log', {
      id: 'log-1',
      tourId: 'tour-1',
      dateTime: '2026-03-15T10:00:00Z',
      comment: 'Test',
      difficulty: 3,
      totalDistance: 1000,
      totalTime: 1,
      rating: 4,
    } satisfies TourLog);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Edit Log');
  });

  it('should not emit saveLog when form is invalid', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.saveLog.subscribe(() => (emitted = true));

    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
    submitBtn.click();

    expect(emitted).toBe(false);
  });

  it('should emit saveLog when form is valid', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.detectChanges();

    const component = fixture.componentInstance as TourLogFormComponent;
    (component as unknown as { form: { setValue: (v: unknown) => void } }).form.setValue({
      id: null,
      tourId: 'tour-1',
      comment: 'Good day',
      difficulty: 3,
      totalDistance: 5000,
      totalTime: 2,
      rating: 4,
    });

    let emitted: TourLogFormValue | null = null;
    fixture.componentInstance.saveLog.subscribe((v: TourLogFormValue) => (emitted = v));

    fixture.detectChanges();
    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
    submitBtn.click();

    expect(emitted).not.toBeNull();
    expect(emitted!.comment).toBe('Good day');
  });

  it('should emit cancel', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.detectChanges();

    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => (cancelled = true));

    const cancelBtn = fixture.nativeElement.querySelector('.log-form__secondary');
    cancelBtn.click();

    expect(cancelled).toBe(true);
  });

  it('should disable submit button when submitting', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.textContent).toContain('Saving');
  });

  it('should show required error for a touched empty comment field', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const commentControl = component['form'].controls['comment'];
    commentControl.setValue('');
    commentControl.markAsTouched();

    expect(component['showError']('comment', 'required')).toBe(true);
  });

  it('should not show required error for an untouched comment field', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    // comment is empty by default but untouched — error must stay hidden
    expect(component['showError']('comment', 'required')).toBe(false);
  });

  it('should show min error for difficulty below 1 when field is touched', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const difficultyControl = component['form'].controls['difficulty'];
    difficultyControl.setValue(0);
    difficultyControl.markAsTouched();

    expect(component['showError']('difficulty', 'min')).toBe(true);
  });

  it('should show max error for difficulty above 5 when field is touched', () => {
    const fixture = TestBed.createComponent(TourLogFormComponent);
    fixture.componentRef.setInput('tourId', 'tour-1');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const difficultyControl = component['form'].controls['difficulty'];
    difficultyControl.setValue(6);
    difficultyControl.markAsTouched();

    expect(component['showError']('difficulty', 'max')).toBe(true);
  });
});
