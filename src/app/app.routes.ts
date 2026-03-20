import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register-page.component').then(
        (m) => m.RegisterPageComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tours',
  },
  {
    path: 'tours',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tours/pages/tours-page.component').then(
        (module) => module.ToursPageComponent,
      ),
  },
  {
    path: 'tour-logs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tour-logs/pages/tour-logs-page.component').then(
        (module) => module.TourLogsPageComponent,
      ),
  },
  {
    path: 'tour-logs/:tourId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tour-logs/pages/tour-logs-page.component').then(
        (module) => module.TourLogsPageComponent,
      ),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/pages/reports-page.component').then(
        (module) => module.ReportsPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'tours',
  },
];
