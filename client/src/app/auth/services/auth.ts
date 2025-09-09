import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { UserInfo } from '../login/model/uesr-interface';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../login/model/login-request-interface';
import { RegisterRequest } from '../login/model/register-request-interface';
import { OnboardingDataDto } from 'src/app/shared/services/onboarding.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'auth';
  userInfo = signal<UserInfo | null>(null);

  getUserInfo(): UserInfo | null {
    return this.userInfo();
  }

  setUserInfo(userInfo: UserInfo): void {
    this.userInfo.set(userInfo);
  }

  login(data: LoginRequest): Observable<LoginRequest[]> {
    return this.http.post<LoginRequest[]>(`${this.baseUrl}/sign-in`, data);
  }

  register(data: RegisterRequest, onboardingData: OnboardingDataDto | null): Observable<any> {
    // The register endpoint will receive the complete payload including onboarding data
    return this.http.post(`${this.baseUrl}/register`, { ...data, onboardingData });
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
  resendOtp(data: { email: string}): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-otp`, data);
  }

  

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      return !!token; // true if token exists
    }
    return false;
  }

  logout(): void {
    // localStorage.removeItem('access_token');
  }
}
