import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavbarComponent } from '../navbar/app-navbar.component';
import { SearchComponent } from '../../features/search/components/search.component';
import { AuthState } from '../../core/auth/auth-state.service';
import { SearchViewModel } from '../../features/search/viewmodels/search.viewmodel';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AppNavbarComponent, SearchComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  protected readonly authState = inject(AuthState);
  protected readonly searchVm = inject(SearchViewModel);
}
