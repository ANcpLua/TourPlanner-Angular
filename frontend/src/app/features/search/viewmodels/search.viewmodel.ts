import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Tour } from '../../tours/models/tour.model';
import { ToursApiService } from '../../tours/services/tours-api.service';

@Injectable({ providedIn: 'root' })
export class SearchViewModel {
  private readonly toursApi = inject(ToursApiService);
  private readonly router = inject(Router);

  readonly searchText = signal('');
  readonly results = signal<readonly Tour[]>([]);
  readonly hasSearched = signal(false);

  async search(): Promise<void> {
    const text = this.searchText().trim();
    if (!text) return;

    try {
      const tours = await firstValueFrom(this.toursApi.searchTours(text));
      this.results.set(tours);
      this.hasSearched.set(true);
    } catch {
      this.results.set([]);
      this.hasSearched.set(true);
    }
  }

  clear(): void {
    this.searchText.set('');
    this.results.set([]);
    this.hasSearched.set(false);
  }

  navigateToTour(tour: Tour): void {
    this.clear();
    void this.router.navigate(['/tours'], { queryParams: { tourId: tour.id } });
  }
}
