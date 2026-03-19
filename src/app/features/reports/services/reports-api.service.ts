import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { Tour } from '../../tours/models/tour.model';

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
      responseType: 'text',
    });
  }

  importTour(json: string): Observable<Tour> {
    return this.http.post<Tour>(this.buildUrl('api/reports/import'), null, {
      params: { json },
    });
  }

  private buildUrl(path: string): string {
    return new URL(path, this.baseUrl).toString();
  }
}
