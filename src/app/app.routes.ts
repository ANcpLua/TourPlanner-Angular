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
    path: '**',
    redirectTo: 'tours',
  },
];
