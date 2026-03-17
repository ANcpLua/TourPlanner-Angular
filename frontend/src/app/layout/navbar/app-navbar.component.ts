import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BROWSER_LOCATION } from '../../core/browser/browser-location.token';
import { AuthState } from '../../core/auth/auth-state.service';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-navbar.component.html',
  styleUrl: './app-navbar.component.css',
})
export class AppNavbarComponent {
  protected readonly authState = inject(AuthState);
  private readonly location = inject(BROWSER_LOCATION);

  protected async logout(): Promise<void> {
    await this.authState.logout();
    this.location.assign('/login');
  }
}
