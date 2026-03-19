import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import {
  ResolveRouteRequest,
  ResolveRouteResponse,
  Tour,
} from '../models/tour.model';

@Injectable({
  providedIn: 'root',
})
export class ToursApiService {
  private readonly apiClient = inject(ApiClientService);

  getTours(): Observable<Tour[]> {
    return this.apiClient.get<Tour[]>('api/tour');
  }

  createTour(tour: Tour): Observable<Tour> {
    return this.apiClient.post<Tour, Tour>('api/tour', tour);
  }

  updateTour(tour: Tour): Observable<Tour> {
    return this.apiClient.put<Tour, Tour>(`api/tour/${tour.id}`, tour);
  }

  deleteTour(id: string): Observable<void> {
    return this.apiClient.delete(`api/tour/${id}`);
  }

  searchTours(searchText: string): Observable<Tour[]> {
    return this.apiClient.get<Tour[]>(
      `api/tour/search/${encodeURIComponent(searchText)}`,
    );
  }

  resolveRoute(
    request: ResolveRouteRequest,
  ): Observable<ResolveRouteResponse> {
    return this.apiClient.post<ResolveRouteRequest, ResolveRouteResponse>(
      'api/routes/resolve',
      request,
    );
  }
}
