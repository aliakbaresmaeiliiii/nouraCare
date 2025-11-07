import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Skip token for auth endpoints and verify-email page
    if (req.url.includes('/auth/') || req.url.includes('/auth/verify-email')) {
      return next.handle(req);
    }

    // Get access token
    const accessToken = this.authService.getAccessToken();
    
    // Add authorization header if token exists
    let authReq = req;
    if (accessToken) {
      authReq = this.addToken(req, accessToken);
      
      // Check if email is verified using access token from auth service
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const isEmailVerified = payload.isVerified;
        
        // If email is not verified, redirect to verify-email page
        if (!isEmailVerified) {
          console.log('Email not verified, redirecting to verify-email page');
          // Use setTimeout to avoid interfering with current navigation
          setTimeout(() => {
            this.router.navigate(['/auth/verify-email']);
          }, 0);
          return throwError(() => new Error('Email not verified'));
        }
      } catch (error) {
        console.error('Failed to check email verification status:', error);
      }
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Skip error handling for auth endpoints
        if (req.url.includes('/auth/')) {
          return throwError(() => error);
        }

        if (error.status === 401 && accessToken) {
          // Access token expired, try to refresh
          return this.handle401Error(req, next);
        } else if (error.status === 404 && this.isUserRelatedRequest(req)) {
          // User not found in database (user data was deleted)
          console.log('User not found in database, logging out...');
          this.authService.logout();
          this.router.navigate(['/auth/sign-in']);
          return throwError(() => new Error('User account no longer exists'));
        }
        
        // For other errors, just throw them
        return throwError(() => error);
      })
    );
  }

  /**
   * Add authorization header to request
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Check if the request is related to user data
   * This helps identify when a user has been deleted from the database
   */
  private isUserRelatedRequest(req: HttpRequest<any>): boolean {
    // Check if the request URL contains user-related endpoints
    const userRelatedPatterns = [
      '/users/',
      '/user/',
      '/profile',
      '/onboarding',
      '/track-data',
      '/symptoms',
      '/cycle',
      '/pregnancy'
    ];
    
    return userRelatedPatterns.some(pattern => req.url.includes(pattern));
  }

  /**
   * Handle 401 Unauthorized errors by refreshing token
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((tokenResponse) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(tokenResponse.accessToken);
          
          // Retry the original request with new token
          return next.handle(this.addToken(request, tokenResponse.accessToken));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          
          // Refresh token failed, redirect to login
          this.authService.logout();
          this.router.navigate(['/auth/sign-in']);
          
          return throwError(() => error);
        })
      );
    } else {
      // If refresh is already in progress, wait for it to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          // Retry the original request with new token
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
}
