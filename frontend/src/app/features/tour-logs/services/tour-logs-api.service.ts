import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { TourLog } from '../models/tour-log.model';

@Injectable({
  providedIn: 'root',
})
export class TourLogsApiService {
  private readonly apiClient = inject(ApiClientService);

  getLogsByTour(tourId: string): Observable<TourLog[]> {
    return this.apiClient.get<TourLog[]>(`api/tourlog/bytour/${tourId}`);
  }

  createLog(log: TourLog): Observable<TourLog> {
    return this.apiClient.post<TourLog, TourLog>('api/tourlog', log);
  }

  updateLog(log: TourLog): Observable<TourLog> {
    return this.apiClient.put<TourLog, TourLog>(`api/tourlog/${log.id}`, log);
  }

  deleteLog(id: string): Observable<void> {
    return this.apiClient.delete(`api/tourlog/${id}`);
  }
}
