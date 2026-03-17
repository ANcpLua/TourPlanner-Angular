import { inject, Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import type { UserInfo } from '../../features/auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly authApi = inject(AuthApiService);

  private readonly user = signal<UserInfo | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly currentUser = this.user.asReadonly();

  async checkSession(): Promise<void> {
    try {
      const user = await firstValueFrom(this.authApi.me());
      this.user.set(user);
    } catch {
      this.user.set(null);
    }
  }

  setUser(user: UserInfo): void {
    this.user.set(user);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.authApi.logout());
    this.clear();
  }

  clear(): void {
    this.user.set(null);
  }
}
