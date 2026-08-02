import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { components } from '../../../core/api/generated/api-types';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { Tour } from '../../tours/models/tour.model';

type ImportTourRequest = components['schemas']['ImportTourRequest'];

@Injectable({
  providedIn: 'root',
})
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getSummaryReport(): Observable<Blob> {
    return this.http.get(this.buildUrl('api/reports/summary'), {
      responseType: 'blob',
    });
  }

  getTourReport(tourId: string): Observable<Blob> {
    return this.http.get(this.buildUrl(`api/reports/tour/${tourId}`), {
      responseType: 'blob',
    });
  }

  exportTour(tourId: string): Observable<string> {
    return this.http.get(this.buildUrl(`api/reports/export/${tourId}`), {
      headers: { Accept: 'application/xml' },
      responseType: 'text',
    });
  }

  importTour(xml: string): Observable<Tour> {
    const request: ImportTourRequest = { xml };
    return this.http.post<Tour>(this.buildUrl('api/reports/import'), request, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private buildUrl(path: string): string {
    return new URL(path, this.baseUrl).toString();
  }
}
