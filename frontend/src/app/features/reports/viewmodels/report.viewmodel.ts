import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Tour } from '../../tours/models/tour.model';
import { ToursApiService } from '../../tours/services/tours-api.service';
import { ReportsApiService } from '../services/reports-api.service';

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

@Injectable({ providedIn: 'root' })
export class ReportViewModel {
  private readonly toursApi = inject(ToursApiService);
  private readonly reportsApi = inject(ReportsApiService);

  private readonly _tours = signal<readonly Tour[]>([]);
  private readonly _selectedTourId = signal<string | null>(null);
  private readonly _isProcessing = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);

  readonly tours = this._tours.asReadonly();
  readonly selectedTourId = this._selectedTourId.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();

  async loadTours(): Promise<void> {
    try {
      const tours = await firstValueFrom(this.toursApi.getTours());
      this._tours.set(tours);
    } catch {
      this._errorMessage.set('Could not load tours.');
    }
  }

  selectTour(tourId: string | null): void {
    this._selectedTourId.set(tourId);
  }

  async generateSummaryReport(): Promise<void> {
    this._isProcessing.set(true);
    this.clearMessages();

    try {
      const blob = await firstValueFrom(this.reportsApi.getSummaryReport());
      triggerDownload(blob, 'SummaryReport.pdf');
      this._successMessage.set('Summary report downloaded.');
    } catch {
      this._errorMessage.set('Could not generate summary report.');
    } finally {
      this._isProcessing.set(false);
    }
  }

  async generateTourReport(): Promise<void> {
    const tourId = this._selectedTourId();
    if (!tourId) return;

    this._isProcessing.set(true);
    this.clearMessages();

    try {
      const blob = await firstValueFrom(this.reportsApi.getTourReport(tourId));
      triggerDownload(blob, `TourReport_${tourId}.pdf`);
      this._successMessage.set('Tour report downloaded.');
    } catch {
      this._errorMessage.set('Could not generate tour report.');
    } finally {
      this._isProcessing.set(false);
    }
  }

  async exportTour(): Promise<void> {
    const tourId = this._selectedTourId();
    if (!tourId) return;

    this._isProcessing.set(true);
    this.clearMessages();

    try {
      const json = await firstValueFrom(this.reportsApi.exportTour(tourId));
      const blob = new Blob([json], { type: 'application/json' });
      triggerDownload(blob, `TourExport_${tourId}.json`);
      this._successMessage.set('Tour exported.');
    } catch {
      this._errorMessage.set('Could not export tour.');
    } finally {
      this._isProcessing.set(false);
    }
  }

  async importTour(file: File): Promise<void> {
    this._isProcessing.set(true);
    this.clearMessages();

    try {
      const json = await file.text();
      await firstValueFrom(this.reportsApi.importTour(json));
      await this.loadTours();
      this._successMessage.set('Tour imported successfully.');
    } catch {
      this._errorMessage.set('Could not import tour. Check the file format.');
    } finally {
      this._isProcessing.set(false);
    }
  }

  private clearMessages(): void {
    this._errorMessage.set(null);
    this._successMessage.set(null);
  }
}
