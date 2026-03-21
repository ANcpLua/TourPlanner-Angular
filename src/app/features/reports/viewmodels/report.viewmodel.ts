import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Tour } from '../../tours/models/tour.model';
import { ToursApiService } from '../../tours/services/tours-api.service';
import { ReportsApiService } from '../services/reports-api.service';

@Injectable({ providedIn: 'root' })
export class ReportViewModel {
  private readonly toursApi = inject(ToursApiService);
  private readonly reportsApi = inject(ReportsApiService);

  readonly tours = signal<readonly Tour[]>([]);
  readonly selectedTourId = signal<string | null>(null);
  readonly isProcessing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  async loadTours(): Promise<void> {
    try {
      const tours = await firstValueFrom(this.toursApi.getTours());
      this.tours.set(tours);
    } catch {
      this.errorMessage.set('Could not load tours.');
    }
  }

  selectTour(tourId: string | null): void {
    this.selectedTourId.set(tourId);
  }

  async generateSummaryReport(): Promise<void> {
    this.isProcessing.set(true);
    this.clearMessages();

    try {
      const blob = await firstValueFrom(this.reportsApi.getSummaryReport());
      this.downloadBlob(blob, 'SummaryReport.pdf');
      this.successMessage.set('Summary report downloaded.');
    } catch {
      this.errorMessage.set('Could not generate summary report.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async generateTourReport(): Promise<void> {
    const tourId = this.selectedTourId();
    if (!tourId) return;

    this.isProcessing.set(true);
    this.clearMessages();

    try {
      const blob = await firstValueFrom(this.reportsApi.getTourReport(tourId));
      this.downloadBlob(blob, `TourReport_${tourId}.pdf`);
      this.successMessage.set('Tour report downloaded.');
    } catch {
      this.errorMessage.set('Could not generate tour report.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async exportTour(): Promise<void> {
    const tourId = this.selectedTourId();
    if (!tourId) return;

    this.isProcessing.set(true);
    this.clearMessages();

    try {
      const json = await firstValueFrom(this.reportsApi.exportTour(tourId));
      const blob = new Blob([json], { type: 'application/json' });
      this.downloadBlob(blob, `TourExport_${tourId}.json`);
      this.successMessage.set('Tour exported.');
    } catch {
      this.errorMessage.set('Could not export tour.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async importTour(file: File): Promise<void> {
    this.isProcessing.set(true);
    this.clearMessages();

    try {
      const json = await file.text();
      await firstValueFrom(this.reportsApi.importTour(json));
      await this.loadTours();
      this.successMessage.set('Tour imported successfully.');
    } catch {
      this.errorMessage.set('Could not import tour. Check the file format.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
