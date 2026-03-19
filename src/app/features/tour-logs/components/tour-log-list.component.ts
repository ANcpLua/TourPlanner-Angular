import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TourLog } from '../models/tour-log.model';

@Component({
  selector: 'app-tour-log-list',
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './tour-log-list.component.html',
  styleUrl: './tour-log-list.component.css',
})
export class TourLogListComponent {
  readonly logs = input.required<readonly TourLog[]>();

  readonly editLog = output<TourLog>();
  readonly deleteLog = output<TourLog>();

  protected trackLog(_: number, log: TourLog): string {
    return log.id;
  }
}
