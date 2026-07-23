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
import { AuthService } from '@app/core/auth/services/auth';
import { Router } from '@angular/router';
import { isPublicAuthRequest } from '@app/core/auth/interceptor/auth-request.util';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private static readonly REFRESH_FAILED = '__jwt_refresh_failed__';

  private authService = inject(AuthService);
  private router = inject(Router);

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const skipBearer = isPublicAuthRequest(req.url);

    // Get access token
    const accessToken = this.authService.getAccessToken();
    // Add authorization header if token exists
    let authReq = req;
    if (accessToken && !skipBearer) {
      authReq = this.addToken(req, accessToken);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (skipBearer) {
          return throwError(() => error);
        }

        if (error.status === 401 && accessToken) {
          // Access token expired, try to refresh
          return this.handle401Error(req, next);
        }

        // Let all other errors (including 404) pass through to callers.
        // Individual services/components can decide how to handle 404s
        // (e.g. \"no reproductive status yet\") without forcing logout.
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
          const newToken = tokenResponse.data.accessToken;
          if (!newToken) {
            return throwError(
              () =>
                new HttpErrorResponse({
                  status: 401,
                  statusText: 'Token refresh returned no access token',
                }),
            );
          }
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(JwtInterceptor.REFRESH_FAILED);

          // Refresh token failed, redirect to login
          this.authService.logout();
          this.router.navigate(['/auth/sign-in']);

          return throwError(() => error);
        }),
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        if (token === JwtInterceptor.REFRESH_FAILED) {
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 401,
                statusText: 'Session expired',
              }),
          );
        }
        return next.handle(this.addToken(request, token));
      }),
    );
  }
}
