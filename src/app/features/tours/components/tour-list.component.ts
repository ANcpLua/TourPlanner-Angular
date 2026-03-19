import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TourView } from '../models/tour.model';

@Component({
  selector: 'app-tour-list',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './tour-list.component.html',
  styleUrl: './tour-list.component.css',
})
export class TourListComponent {
  readonly tours = input.required<readonly TourView[]>();
  readonly selectedTourId = input<string | null>(null);

  readonly selectTour = output<TourView>();
  readonly editTour = output<TourView>();
  readonly deleteTour = output<TourView>();

  protected trackTour(_: number, tour: TourView): string {
    return tour.id;
  }
}
