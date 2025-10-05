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
    // Skip token for auth endpoints
    if (req.url.includes('/auth/')) {
      return next.handle(req);
    }

    // Add authorization header with current access token
    const accessToken = this.authService.getAccessToken();
    let authReq = req;
    
    if (accessToken) {
      authReq = this.addToken(req, accessToken);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && accessToken) {
          // Access token expired, try to refresh
          return this.handle401Error(authReq, next);
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
