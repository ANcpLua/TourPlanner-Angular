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

  private readonly _isLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  async login(request: LoginRequest): Promise<void> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    try {
      const user = await firstValueFrom(this.authApi.login(request));
      this.authState.setUser(user);
      await this.router.navigate(['/tours']);
    } catch {
      this._errorMessage.set('Invalid email or password.');
    } finally {
      this._isLoading.set(false);
    }
  }

  async register(request: RegisterRequest): Promise<void> {
    this._isLoading.set(true);
    this._errorMessage.set(null);

    try {
      await firstValueFrom(this.authApi.register(request));
      await this.login({ email: request.email, password: request.password });
    } catch {
      this._errorMessage.set('Registration failed. Email may already be in use.');
    } finally {
      this._isLoading.set(false);
    }
  }
}
