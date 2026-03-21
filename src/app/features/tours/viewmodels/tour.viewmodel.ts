import { inject, Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ToursApiService } from '../services/tours-api.service';
import {
  buildTourForSave,
  getCityCoordinates,
  ResolveRouteRequest,
  Tour,
  TourFormValue,
} from '../models/tour.model';

@Injectable({ providedIn: 'root' })
export class TourViewModel {
  private readonly toursApi = inject(ToursApiService);

  private readonly _tours = signal<readonly Tour[]>([]);
  readonly tours = this._tours.asReadonly();
  readonly selectedTourId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isFormVisible = signal(false);
  readonly editingTourId = signal<string | null>(null);

  readonly selectedTour = computed(
    () => this.tours().find((t) => t.id === this.selectedTourId()) ?? null,
  );

  readonly editingTour = computed(
    () => this.tours().find((t) => t.id === this.editingTourId()) ?? null,
  );

  readonly mapCoordinates = computed(() => {
    const tour = this.selectedTour();
    if (!tour?.routeInformation) return null;
    try {
      const info = JSON.parse(tour.routeInformation);
      return {
        fromLat: info.FromCoordinates?.Latitude as number,
        fromLng: info.FromCoordinates?.Longitude as number,
        toLat: info.ToCoordinates?.Latitude as number,
        toLng: info.ToCoordinates?.Longitude as number,
      };
    } catch {
      return null;
    }
  });

  async loadTours(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const tours = await firstValueFrom(this.toursApi.getTours());
      this._tours.set(tours);

      const currentSelection = this.selectedTourId();
      const hasSelection = tours.some((t) => t.id === currentSelection);
      const nextSelection =
        hasSelection || tours.length === 0 ? currentSelection : tours[0].id;

      this.selectedTourId.set(nextSelection);
    } catch {
      this.errorMessage.set(
        'Could not load tours from the backend. Check whether the API is running.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  selectTour(tour: Tour): void {
    this.selectedTourId.set(tour.id);
  }

  openCreateForm(): void {
    this.editingTourId.set(null);
    this.isFormVisible.set(true);
  }

  openEditForm(tour: Tour): void {
    this.selectedTourId.set(tour.id);
    this.editingTourId.set(tour.id);
    this.isFormVisible.set(true);
  }

  closeForm(): void {
    this.isFormVisible.set(false);
    this.editingTourId.set(null);
  }

  async saveTour(formValue: TourFormValue): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const preparedTour = await this.prepareTourForSave(formValue);
      const savedTour = formValue.id
        ? await firstValueFrom(this.toursApi.updateTour(preparedTour))
        : await firstValueFrom(this.toursApi.createTour(preparedTour));

      await this.loadTours();
      this.selectedTourId.set(savedTour.id);
      this.closeForm();
    } catch {
      this.errorMessage.set(
        'Could not save the tour. Check the selected route data and backend connectivity.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteTour(tour: Tour): Promise<void> {
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.toursApi.deleteTour(tour.id));
      await this.loadTours();

      if (this.selectedTourId() === tour.id) {
        this.selectedTourId.set(this.tours()[0]?.id ?? null);
      }
    } catch {
      this.errorMessage.set('Could not delete the selected tour.');
    }
  }

  private async prepareTourForSave(formValue: TourFormValue): Promise<Tour> {
    const fromCoordinates = getCityCoordinates(formValue.from);
    const toCoordinates = getCityCoordinates(formValue.to);

    const request: ResolveRouteRequest = {
      fromLatitude: fromCoordinates.latitude,
      fromLongitude: fromCoordinates.longitude,
      toLatitude: toCoordinates.latitude,
      toLongitude: toCoordinates.longitude,
      transportType: formValue.transportType,
    };

    const route = await firstValueFrom(this.toursApi.resolveRoute(request));
    return buildTourForSave(formValue, route);
  }
}
