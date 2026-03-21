import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import {
  createEmptyTourLogFormValue,
  createTourLogFormValue,
  TourLog,
  TourLogFormValue,
} from '../models/tour-log.model';

type TourLogFormGroup = FormGroup<{
  id: FormControl<string | null>;
  tourId: FormControl<string>;
  comment: FormControl<string>;
  difficulty: FormControl<number>;
  totalDistance: FormControl<number>;
  totalTime: FormControl<number>;
  rating: FormControl<number>;
}>;

@Component({
  selector: 'app-tour-log-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './tour-log-form.component.html',
  styleUrl: './tour-log-form.component.css',
})
export class TourLogFormComponent {
  readonly log = input<TourLog | null>(null);
  readonly tourId = input.required<string>();
  readonly submitting = input(false);

  readonly saveLog = output<TourLogFormValue>();
  readonly cancel = output<void>();

  protected readonly form: TourLogFormGroup = new FormGroup({
    id: new FormControl<string | null>(null),
    tourId: new FormControl('', { nonNullable: true }),
    comment: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    difficulty: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)],
    }),
    totalDistance: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    totalTime: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    rating: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)],
    }),
  });

  private readonly resetFormEffect = effect(() => {
    const log = this.log();
    const tourId = this.tourId();
    const formValue = log
      ? createTourLogFormValue(log)
      : createEmptyTourLogFormValue(tourId);

    this.form.reset(formValue, { emitEvent: false });
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saveLog.emit(this.form.getRawValue());
  }

  protected control(name: keyof TourLogFormValue): AbstractControl {
    return this.form.controls[name];
  }

  protected showError(
    name: keyof TourLogFormValue,
    error: string,
  ): boolean {
    const ctrl = this.control(name);
    return ctrl.hasError(error) && (ctrl.touched || ctrl.dirty);
  }
}
