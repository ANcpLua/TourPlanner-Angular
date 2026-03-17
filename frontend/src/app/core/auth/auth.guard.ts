import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthState } from './auth-state.service';

export const authGuard: CanActivateFn = async () => {
  const authState = inject(AuthState);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    await authState.checkSession();
  }

  if (authState.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
