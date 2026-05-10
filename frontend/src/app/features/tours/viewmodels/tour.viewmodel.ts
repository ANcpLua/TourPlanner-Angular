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
  private readonly _selectedTourId = signal<string | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _isFormVisible = signal(false);
  private readonly _editingTourId = signal<string | null>(null);

  readonly tours = this._tours.asReadonly();
  readonly selectedTourId = this._selectedTourId.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly isFormVisible = this._isFormVisible.asReadonly();
  readonly editingTourId = this._editingTourId.asReadonly();

  readonly selectedTour = computed(
    () => this._tours().find((t) => t.id === this._selectedTourId()) ?? null,
  );

  readonly editingTour = computed(
    () => this._tours().find((t) => t.id === this._editingTourId()) ?? null,
  );

  readonly mapCoordinates = computed(() => {
    const tour = this.selectedTour();
    if (!tour?.routeInformation) return null;
    try {
      const info = JSON.parse(tour.routeInformation);
      const geometryRaw = info.Geometry as readonly (readonly (number | string)[])[] | undefined;
      const geometry = Array.isArray(geometryRaw)
        ? geometryRaw
            .filter((p) => Array.isArray(p) && p.length >= 2)
            .map((p) => [Number(p[0]), Number(p[1])] as [number, number])
        : null;
      return {
        fromLat: info.FromCoordinates?.Latitude as number,
        fromLng: info.FromCoordinates?.Longitude as number,
        toLat: info.ToCoordinates?.Latitude as number,
        toLng: info.ToCoordinates?.Longitude as number,
        geometry: geometry && geometry.length >= 2 ? geometry : null,
      };
    } catch {
      return null;
    }
  });

  async loadTours(): Promise<void> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    try {
      const tours = await firstValueFrom(this.toursApi.getTours());
      this._tours.set(tours);

      const currentSelection = this._selectedTourId();
      const hasSelection = tours.some((t) => t.id === currentSelection);
      const nextSelection =
        hasSelection || tours.length === 0 ? currentSelection : tours[0].id;

      this._selectedTourId.set(nextSelection);
    } catch {
      this._errorMessage.set(
        'Could not load tours from the backend. Check whether the API is running.',
      );
    } finally {
      this._isLoading.set(false);
    }
  }

  selectTour(tour: Tour): void {
    this._selectedTourId.set(tour.id);
  }

  openCreateForm(): void {
    this._editingTourId.set(null);
    this._isFormVisible.set(true);
  }

  openEditForm(tour: Tour): void {
    this._selectedTourId.set(tour.id);
    this._editingTourId.set(tour.id);
    this._isFormVisible.set(true);
  }

  closeForm(): void {
    this._isFormVisible.set(false);
    this._editingTourId.set(null);
  }

  async saveTour(formValue: TourFormValue): Promise<void> {
    this._isSaving.set(true);
    this._errorMessage.set(null);

    try {
      const preparedTour = await this.prepareTourForSave(formValue);
      const savedTour = formValue.id
        ? await firstValueFrom(this.toursApi.updateTour(preparedTour))
        : await firstValueFrom(this.toursApi.createTour(preparedTour));

      await this.loadTours();
      this._selectedTourId.set(savedTour.id);
      this.closeForm();
    } catch {
      this._errorMessage.set(
        'Could not save the tour. Check the selected route data and backend connectivity.',
      );
    } finally {
      this._isSaving.set(false);
    }
  }

  async deleteTour(tour: Tour): Promise<void> {
    this._errorMessage.set(null);

    try {
      await firstValueFrom(this.toursApi.deleteTour(tour.id));
      await this.loadTours();

      if (this._selectedTourId() === tour.id) {
        this._selectedTourId.set(this._tours()[0]?.id ?? null);
      }
    } catch {
      this._errorMessage.set('Could not delete the selected tour.');
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
