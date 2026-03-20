import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TourLogListComponent } from '../components/tour-log-list.component';
import { TourLogFormComponent } from '../components/tour-log-form.component';
import { TourLogViewModel } from '../viewmodels/tour-log.viewmodel';

@Component({
  selector: 'app-tour-logs-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TourLogListComponent, TourLogFormComponent],
  templateUrl: './tour-logs-page.component.html',
  styleUrl: './tour-logs-page.component.css',
})
export class TourLogsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly vm = inject(TourLogViewModel);

  async ngOnInit(): Promise<void> {
    await this.vm.loadTours();

    const tourId = this.route.snapshot.paramMap.get('tourId');
    if (tourId) {
      await this.vm.selectTour(tourId);
    }
  }

  protected async onTourSelected(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    await this.vm.selectTour(select.value || null);
  }
}
