import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthState } from '../../core/auth/auth-state.service';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-navbar.component.html',
  styleUrl: './app-navbar.component.css',
})
export class AppNavbarComponent {
  protected readonly authState = inject(AuthState);
  private readonly authApi = inject(AuthApiService);

  protected async logout(): Promise<void> {
    await firstValueFrom(this.authApi.logout());
    this.authState.clear();
    window.location.href = '/login';
  }
}
