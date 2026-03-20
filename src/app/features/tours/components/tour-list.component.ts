import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tour } from '../models/tour.model';

@Component({
  selector: 'app-tour-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './tour-list.component.html',
  styleUrl: './tour-list.component.css',
})
export class TourListComponent {
  readonly tours = input.required<readonly Tour[]>();
  readonly selectedTourId = input<string | null>(null);

  readonly selectTour = output<Tour>();
  readonly editTour = output<Tour>();
  readonly deleteTour = output<Tour>();

  protected trackTour(_: number, tour: Tour): string {
    return tour.id;
  }
}
