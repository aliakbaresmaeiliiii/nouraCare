import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest } from '../model/login-request-interface';
import { RegisterRequest } from '../model/register-request-interface';
import { environment } from '../../environments/environments';
import { UserInfo } from '../model/uesr-interface';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private baseUrl = environment.apiEndPoint + 'auth';
  userInfo = signal<UserInfo | null>(null);

  getUserInfo(): UserInfo | null {
    return this.userInfo();
  }

  setUserInfo(userInfo: UserInfo): void {
    this.userInfo.set(userInfo);
  }

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
  verifyEmail(data: { email: string; verify_code: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-email`, data);
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
