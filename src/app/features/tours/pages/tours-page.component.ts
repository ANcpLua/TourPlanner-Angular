import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TourFormComponent } from '../components/tour-form.component';
import { TourListComponent } from '../components/tour-list.component';
import {
  buildTourForSave,
  getCityCoordinates,
  ResolveRouteRequest,
  Tour,
  TourFormValue,
} from '../models/tour.model';
import { ToursApiService } from '../services/tours-api.service';

@Component({
  selector: 'app-tours-page',
  imports: [CommonModule, DecimalPipe, TourFormComponent, TourListComponent],
  templateUrl: './tours-page.component.html',
  styleUrl: './tours-page.component.css',
})
export class ToursPageComponent implements OnInit {
  private readonly toursApi = inject(ToursApiService);

  protected readonly tours = signal<readonly Tour[]>([]);
  protected readonly selectedTourId = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isFormVisible = signal(false);
  protected readonly editingTourId = signal<string | null>(null);

  protected readonly selectedTour = computed(
    () => this.tours().find((tour) => tour.id === this.selectedTourId()) ?? null,
  );

  protected readonly editingTour = computed(
    () => this.tours().find((tour) => tour.id === this.editingTourId()) ?? null,
  );

  async ngOnInit(): Promise<void> {
    await this.loadTours();
  }

  protected async loadTours(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const tours = await firstValueFrom(this.toursApi.getTours());
      this.tours.set(tours);

      const currentSelection = this.selectedTourId();
      const hasSelection = tours.some((tour) => tour.id === currentSelection);
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

  protected selectTour(tour: Tour): void {
    this.selectedTourId.set(tour.id);
  }

  protected openCreateForm(): void {
    this.editingTourId.set(null);
    this.isFormVisible.set(true);
  }

  protected openEditForm(tour: Tour): void {
    this.selectedTourId.set(tour.id);
    this.editingTourId.set(tour.id);
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.isFormVisible.set(false);
    this.editingTourId.set(null);
  }

  protected async saveTour(formValue: TourFormValue): Promise<void> {
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

  protected async deleteTour(tour: Tour): Promise<void> {
    const shouldDelete = window.confirm(
      `Delete tour "${tour.name}"? This cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

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
