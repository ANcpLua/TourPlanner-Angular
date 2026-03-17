import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import type { LoginRequest, RegisterRequest, UserInfo } from '../../features/auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  register(request: RegisterRequest): Observable<void> {
    return this.http.post<void>(this.url('api/auth/register'), request);
  }

  login(request: LoginRequest): Observable<UserInfo> {
    return this.http.post<UserInfo>(this.url('api/auth/login'), request);
  }

  logout(): Observable<void> {
    return this.http.post<void>(this.url('api/auth/logout'), {});
  }

  me(): Observable<UserInfo> {
    return this.http.get<UserInfo>(this.url('api/auth/me'));
  }

  private url(path: string): string {
    return new URL(path, this.baseUrl).toString();
  }
}
