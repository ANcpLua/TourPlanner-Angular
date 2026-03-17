import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { BROWSER_LOCATION } from '../browser/browser-location.token';
import { AuthState } from './auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthState);
  const location = inject(BROWSER_LOCATION);

  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.includes('/api/auth/')) {
        authState.clear();
        location.assign('/login');
      }
      return throwError(() => error);
    }),
  );
};
