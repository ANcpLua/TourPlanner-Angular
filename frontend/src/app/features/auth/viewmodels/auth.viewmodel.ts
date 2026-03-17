import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { AuthState } from '../../../core/auth/auth-state.service';
import type { LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthViewModel {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async login(request: LoginRequest): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const user = await firstValueFrom(this.authApi.login(request));
      this.authState.setUser(user);
      await this.router.navigate(['/tours']);
    } catch {
      this.errorMessage.set('Invalid email or password.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async register(request: RegisterRequest): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.authApi.register(request));
      await this.login({ email: request.email, password: request.password });
    } catch {
      this.errorMessage.set('Registration failed. Email may already be in use.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
