import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest } from '../model/login-request-interface';
import { RegisterRequest } from '../model/register-request-interface';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private baseUrl = '/api/auth';

  http = inject(HttpClient);

  login(data: LoginRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, {
      token,
      password,
    });
  }

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      return !!token; // true if token exists
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('access_token');
  }
}
