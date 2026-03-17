import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Component, effect, input, output } from '@angular/core';
import {
  CITY_OPTIONS,
  createEmptyTourFormValue,
  createTourFormValue,
  Tour,
  TourFormValue,
  TransportType,
} from '../models/tour.model';

type TourFormGroup = FormGroup<{
  id: FormControl<string | null>;
  name: FormControl<string>;
  description: FormControl<string>;
  from: FormControl<string>;
  to: FormControl<string>;
  transportType: FormControl<TransportType>;
}>;

function distinctCitiesValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const from = control.get('from')?.value;
  const to = control.get('to')?.value;

  if (!from || !to || from !== to) {
    return null;
  }

  return { identicalCities: true };
}

@Component({
  selector: 'app-tour-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tour-form.component.html',
  styleUrl: './tour-form.component.css',
})
export class TourFormComponent {
  readonly tour = input<Tour | null>(null);
  readonly submitting = input(false);

  readonly saveTour = output<TourFormValue>();
  readonly cancel = output<void>();

  protected readonly cityOptions = CITY_OPTIONS;
  protected readonly transportTypes: readonly TransportType[] = [
    'Car',
    'Bike',
    'Foot',
  ];

  protected readonly form: TourFormGroup = new FormGroup(
    {
      id: new FormControl<string | null>(null),
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      from: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      to: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      transportType: new FormControl<TransportType>('Car', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [distinctCitiesValidator] },
  );

  private readonly resetFormEffect = effect(() => {
    const tour = this.tour();
    const formValue = tour ? createTourFormValue(tour) : createEmptyTourFormValue();

    this.form.reset(formValue, { emitEvent: false });
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saveTour.emit(this.form.getRawValue());
  }

  protected control(name: keyof TourFormValue): AbstractControl {
    return this.form.controls[name];
  }

  protected showRequiredError(name: keyof TourFormValue): boolean {
    const control = this.control(name);
    return control.hasError('required') && (control.touched || control.dirty);
  }
}
