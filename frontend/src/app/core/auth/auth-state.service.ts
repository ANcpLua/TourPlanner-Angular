import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import type { UserInfo } from '../../features/auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly authApi = inject(AuthApiService);

  private readonly _user = signal<UserInfo | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  async checkSession(): Promise<void> {
    this._isLoading.set(true);
    try {
      const user = await firstValueFrom(this.authApi.me());
      this._user.set(user);
    } catch {
      // A failed /me call means "no active session" — the expected response
      // when the auth cookie is absent or expired. Treat as logged-out
      // rather than surfacing an error banner during app startup.
      this._user.set(null);
    } finally {
      this._isLoading.set(false);
    }
  }

  setUser(user: UserInfo): void {
    this._user.set(user);
    this._errorMessage.set(null);
  }

  async logout(): Promise<void> {
    this._isLoading.set(true);
    this._errorMessage.set(null);
    try {
      await firstValueFrom(this.authApi.logout());
    } catch {
      this._errorMessage.set(
        'Could not reach the server. You have been signed out locally.',
      );
    } finally {
      this.clear();
      this._isLoading.set(false);
    }
  }

  clear(): void {
    this._user.set(null);
  }
}
