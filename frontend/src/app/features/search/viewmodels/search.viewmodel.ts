import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Tour } from '../../tours/models/tour.model';
import { ToursApiService } from '../../tours/services/tours-api.service';

@Injectable({ providedIn: 'root' })
export class SearchViewModel {
  private readonly toursApi = inject(ToursApiService);
  private readonly router = inject(Router);

  private readonly _searchText = signal('');
  private readonly _results = signal<readonly Tour[]>([]);
  private readonly _hasSearched = signal(false);
  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly searchText = this._searchText.asReadonly();
  readonly results = this._results.asReadonly();
  readonly hasSearched = this._hasSearched.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  setSearchText(value: string): void {
    this._searchText.set(value);
  }

  async search(): Promise<void> {
    const text = this._searchText().trim();
    if (!text || this._isLoading()) return;

    this._isLoading.set(true);
    this._errorMessage.set(null);

    try {
      const tours = await firstValueFrom(this.toursApi.searchTours(text));
      this._results.set(tours);
      this._hasSearched.set(true);
    } catch {
      this._results.set([]);
      this._hasSearched.set(true);
      this._errorMessage.set('Search failed. Check whether the API is running.');
    } finally {
      this._isLoading.set(false);
    }
  }

  clear(): void {
    this._searchText.set('');
    this._results.set([]);
    this._hasSearched.set(false);
    this._errorMessage.set(null);
  }

  navigateToTour(tour: Tour): void {
    this.clear();
    void this.router.navigate(['/tours'], { queryParams: { tourId: tour.id } });
  }
}
