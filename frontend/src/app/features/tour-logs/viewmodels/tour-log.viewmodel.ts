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

  private readonly _tours = signal<readonly Tour[]>([]);
  private readonly _selectedTourId = signal<string | null>(null);
  private readonly _logs = signal<readonly TourLog[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _isFormVisible = signal(false);
  private readonly _editingLogId = signal<string | null>(null);

  readonly tours = this._tours.asReadonly();
  readonly selectedTourId = this._selectedTourId.asReadonly();
  readonly logs = this._logs.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly isFormVisible = this._isFormVisible.asReadonly();
  readonly editingLogId = this._editingLogId.asReadonly();

  readonly editingLog = computed(
    () => this._logs().find((l) => l.id === this._editingLogId()) ?? null,
  );

  async loadTours(): Promise<void> {
    try {
      const tours = await firstValueFrom(this.toursApi.getTours());
      this._tours.set(tours);
    } catch {
      this._errorMessage.set('Could not load tours.');
    }
  }

  async selectTour(tourId: string | null): Promise<void> {
    this._selectedTourId.set(tourId);
    this.closeForm();

    if (tourId) {
      await this.loadLogs();
    } else {
      this._logs.set([]);
    }
  }

  async loadLogs(): Promise<void> {
    const tourId = this._selectedTourId();
    if (!tourId) return;

    this._isLoading.set(true);
    this._errorMessage.set(null);

    try {
      const logs = await firstValueFrom(this.logsApi.getLogsByTour(tourId));
      this._logs.set(logs);
    } catch {
      this._errorMessage.set('Could not load tour logs.');
    } finally {
      this._isLoading.set(false);
    }
  }

  openCreateForm(): void {
    this._editingLogId.set(null);
    this._isFormVisible.set(true);
  }

  openEditForm(log: TourLog): void {
    this._editingLogId.set(log.id);
    this._isFormVisible.set(true);
  }

  closeForm(): void {
    this._isFormVisible.set(false);
    this._editingLogId.set(null);
  }

  async saveLog(formValue: TourLogFormValue): Promise<void> {
    this._isSaving.set(true);
    this._errorMessage.set(null);

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
      this._errorMessage.set('Could not save the tour log.');
    } finally {
      this._isSaving.set(false);
    }
  }

  async deleteLog(log: TourLog): Promise<void> {
    this._errorMessage.set(null);

    try {
      await firstValueFrom(this.logsApi.deleteLog(log.id));
      await this.loadLogs();
    } catch {
      this._errorMessage.set('Could not delete the log.');
    }
  }
}
