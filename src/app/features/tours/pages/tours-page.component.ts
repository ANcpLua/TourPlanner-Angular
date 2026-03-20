import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TourFormComponent } from '../components/tour-form.component';
import { TourListComponent } from '../components/tour-list.component';
import { TourMapComponent } from '../components/tour-map.component';
import { TourViewModel } from '../viewmodels/tour.viewmodel';

@Component({
  selector: 'app-tours-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, TourFormComponent, TourListComponent, TourMapComponent, RouterLink],
  templateUrl: './tours-page.component.html',
  styleUrl: './tours-page.component.css',
})
export class ToursPageComponent implements OnInit {
  protected readonly vm = inject(TourViewModel);

  async ngOnInit(): Promise<void> {
    await this.vm.loadTours();
  }
}
