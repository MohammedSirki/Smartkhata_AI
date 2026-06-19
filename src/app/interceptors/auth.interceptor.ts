import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const isBrowser = isPlatformBrowser(platformId);
  const token = isBrowser ? localStorage.getItem('smartkhata_token') : null;
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isBrowser) {
        localStorage.removeItem('smartkhata_token');
        localStorage.removeItem('smartkhata_user');
        void router.navigate(['/auth/login']);
      }

      return throwError(() => error);
    }),
  );
};
