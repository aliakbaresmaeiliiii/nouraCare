import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    return true;
  }

  // If not authenticated, check if we have a refresh token
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (refreshToken) {
    // Try to refresh the token
    return authService.refreshToken().pipe(
      map(() => {
        // Token refreshed successfully, allow access
        return true;
      }),
      catchError(() => {
        // Refresh failed, redirect to login
        router.navigate(['/auth/sign-in'], {
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      })
    );
  }

  // No refresh token available, redirect to login
  router.navigate(['/auth/sign-in'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
