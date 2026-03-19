import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tours',
  },
  {
    path: 'tours',
    loadComponent: () =>
      import('./features/tours/pages/tours-page.component').then(
        (module) => module.ToursPageComponent,
      ),
  },
  {
    path: 'tour-logs',
    loadComponent: () =>
      import('./features/tour-logs/pages/tour-logs-page.component').then(
        (module) => module.TourLogsPageComponent,
      ),
  },
  {
    path: 'tour-logs/:tourId',
    loadComponent: () =>
      import('./features/tour-logs/pages/tour-logs-page.component').then(
        (module) => module.TourLogsPageComponent,
      ),
  },
  {
    path: 'reports',
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
