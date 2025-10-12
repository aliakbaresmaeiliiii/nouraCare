import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated via AuthService (JWT tokens)
  if (authService.isAuthenticated()) {
    // Additional check: verify the token is still valid and user exists
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if token is expired
        if (payload.exp < currentTime) {
          console.log('Token expired, logging out...');
          authService.logout();
          router.navigate(['/auth/sign-in'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
        
        // Token is valid, allow access
        return true;
      } catch (error) {
        console.error('Error decoding token:', error);
        // Invalid token, log out
        authService.logout();
        router.navigate(['/auth/sign-in'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    }
    return true;
  }

  // Check if user has userInfo in localStorage (fallback authentication)
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      const parsedUserInfo = JSON.parse(userInfo);
      // If we have valid userInfo, update AuthService state and allow access
      if (parsedUserInfo && (parsedUserInfo.id || parsedUserInfo.user?.id)) {
        // Update AuthService authentication state
        authService.setUserInfo({
          id: parsedUserInfo.id || parsedUserInfo.user?.id,
          email: parsedUserInfo.email || '',
          phone: parsedUserInfo.phone || '',
          isVerified: true,
        });
        return true;
      }
    } catch (error) {
      console.error('Error parsing userInfo:', error);
    }
  }

  // If not authenticated, check if we have an access token
  const accessToken = localStorage.getItem('accessToken');
  
  if (accessToken) {
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

  // No authentication available, redirect to login
  router.navigate(['/auth/sign-in'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
