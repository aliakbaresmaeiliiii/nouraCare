import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface UserInfo {
  accessToken?: string;
  refreshToken?: string;
  [key: string]: any;
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip adding headers for auth endpoints - let JwtInterceptor handle it
    if (req.url.includes('/auth/') || req.url.includes('/auth/verify-email')) {
      return next.handle(req);
    }

    // Create headers object
    const headers: { [key: string]: string } = {};
    
    // Note: User-Id header removed due to CORS issues
    // Server needs to add 'User-Id' to Access-Control-Allow-Headers
    // Alternative: Send userId in request body or query parameters
    
    const authReq = Object.keys(headers).length > 0
      ? req.clone({ setHeaders: headers })
      : req;

    return next.handle(authReq).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const response = event.body;
          if (!this.isSuccessResponse(response)) {
            return event;
          }
          // JSON arrays (`[]`) must stay arrays — `{ ...[] }` becomes `{ 0?, 1? }`
          // and breaks `.map()`, so list endpoints stay unchanged.
          if (Array.isArray(response)) {
            return event;
          }
          return event.clone({
            body: {
              ...response,
              success: true,
              isSuccess: true,
            },
          });
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        // Handle unauthorized (token expired)
        if (error.status === 401) {
          console.warn('⚠️ Unauthorized: token may be expired or invalid');
          // You could trigger refresh-token logic here later
        }

        const errorResponse = {
          success: false,
          isSuccess: false,
          message: error.error?.message || error.message || 'An error occurred',
          messageKey:
            typeof error.error?.messageKey === 'string'
              ? error.error.messageKey
              : undefined,
          error: error.error,
          status: error.status,
        };

        return throwError(() => errorResponse);
      })
    );
  }

  /**
   * Safely parse userInfo from localStorage
   */
  private getUserInfo(): UserInfo | null {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;

    // lightweight safe parse without try/catch
    return this.safeJsonParse<UserInfo>(raw);
  }

  /**
   * Type-safe JSON parser without throwing errors
   */
  private safeJsonParse<T>(value: string): T | null {
    if (!value.trim().startsWith('{') && !value.trim().startsWith('[')) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Detects whether response is a success
   */
  private isSuccessResponse(response: any): boolean {
    if (response == null) {
      return false;
    }
    if (Array.isArray(response)) {
      return true;
    }
    const msg = typeof response.message === 'string' ? response.message : '';
    return (
      response?.code === 200 ||
      response?.success === true ||
      response?.status === 'success' ||
      (!response.error && !msg.toLowerCase().includes('error'))
    );
  }
}
