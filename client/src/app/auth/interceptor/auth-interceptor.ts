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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Add authorization header
    const token = localStorage.getItem('access_token');
    let modifiedReq = req;
    
    if (token) {
      // Add Authorization header with Bearer token
      modifiedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      // NOTE: Adding user ID as a header is generally NOT recommended for security reasons.
      // The user ID should be extracted from the JWT token on the backend, not sent from the frontend.
      // This is provided as an example only if specifically required.
      try {
        // Extract payload from JWT token (base64 encoded)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub || payload.userId || payload.id;
        
        if (userId) {
          // Add user ID as a custom header
          modifiedReq = modifiedReq.clone({
            setHeaders: {
              'X-User-ID': userId.toString(),
            },
          });
          
          console.log('🔐 Auth interceptor: Added X-User-ID header:', userId);
        }
      } catch (error) {
        console.error('❌ Failed to extract user ID from token:', error);
      }
    }

    return next.handle(modifiedReq).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Handle successful responses
          const response = event.body;
          
          // Check if response indicates success based on your backend structure
          if (this.isSuccessResponse(response)) {
            // Transform response to include a consistent success flag
            const transformedResponse = {
              ...response,
              success: true,
              isSuccess: true
            };
            
            return event.clone({
              body: transformedResponse
            });
          }
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        // Handle error responses
        console.error('HTTP Error:', error);
        
        // Transform error to include consistent error structure
        const errorResponse = {
          success: false,
          isSuccess: false,
          message: error.error?.message || error.message || 'An error occurred',
          error: error.error,
          status: error.status
        };
        
        return throwError(() => errorResponse);
      })
    );
  }

  private isSuccessResponse(response: any): boolean {
    // Check various success indicators from your backend
    return (
      response?.code === 200 ||
      response?.message === 'email is verified successfully' ||
      response?.success === true ||
      response?.status === 'success' ||
      // Add more success conditions based on your backend response patterns
      (response && !response.error && !response.message?.toLowerCase().includes('error'))
    );
  }
}
