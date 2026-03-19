import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ToursApiService } from '../../tours/services/tours-api.service';
import { Tour } from '../../tours/models/tour.model';
import { TourLogsApiService } from '../services/tour-logs-api.service';
import {
  buildTourLogForSave,
  TourLog,
  TourLogFormValue,
} from '../models/tour-log.model';

@Injectable({ providedIn: 'root' })
export class TourLogViewModel {
  private readonly toursApi = inject(ToursApiService);
  private readonly logsApi = inject(TourLogsApiService);

  readonly tours = signal<readonly Tour[]>([]);
  readonly selectedTourId = signal<string | null>(null);
  readonly logs = signal<readonly TourLog[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isFormVisible = signal(false);
  readonly editingLogId = signal<string | null>(null);

  readonly editingLog = computed(
    () => this.logs().find((l) => l.id === this.editingLogId()) ?? null,
  );

  async loadTours(): Promise<void> {
    try {
      const tours = await firstValueFrom(this.toursApi.getTours());
      this.tours.set(tours);
    } catch {
      this.errorMessage.set('Could not load tours.');
    }
  }

  async selectTour(tourId: string | null): Promise<void> {
    this.selectedTourId.set(tourId);
    this.closeForm();

    if (tourId) {
      await this.loadLogs();
    } else {
      this.logs.set([]);
    }
  }

  async loadLogs(): Promise<void> {
    const tourId = this.selectedTourId();
    if (!tourId) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const logs = await firstValueFrom(this.logsApi.getLogsByTour(tourId));
      this.logs.set(logs);
    } catch {
      this.errorMessage.set('Could not load tour logs.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreateForm(): void {
    this.editingLogId.set(null);
    this.isFormVisible.set(true);
  }

  openEditForm(log: TourLog): void {
    this.editingLogId.set(log.id);
    this.isFormVisible.set(true);
  }

  closeForm(): void {
    this.isFormVisible.set(false);
    this.editingLogId.set(null);
  }

  async saveLog(formValue: TourLogFormValue): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const prepared = buildTourLogForSave(formValue);
      if (formValue.id) {
        await firstValueFrom(this.logsApi.updateLog(prepared));
      } else {
        await firstValueFrom(this.logsApi.createLog(prepared));
      }

      await this.loadLogs();
      this.closeForm();
    } catch {
      this.errorMessage.set('Could not save the tour log.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteLog(log: TourLog): Promise<void> {
    const shouldDelete = window.confirm('Delete this log? This cannot be undone.');
    if (!shouldDelete) return;

    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.logsApi.deleteLog(log.id));
      await this.loadLogs();
    } catch {
      this.errorMessage.set('Could not delete the log.');
    }
  }
}
