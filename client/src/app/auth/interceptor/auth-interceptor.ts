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
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req).pipe(
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
