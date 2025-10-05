import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { UserInfo } from '../login/model/uesr-interface';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../login/model/login-request-interface';
import { RegisterRequest } from '../login/model/register-request-interface';
import { OnboardingDataDto } from 'src/app/shared/services/onboarding.service';
import { TokenResponse, JwtPayload } from '../models/token.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = environment.apiEndPoint + 'auth';
  
  // Store Access Token in memory using BehaviorSubject
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  public accessToken$ = this.accessTokenSubject.asObservable();
  
  // User info signal
  userInfo = signal<UserInfo | null>(null);
  
  // Authentication state signal
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  // Computed signal for current user
  currentUser = computed(() => this.userInfo());

  constructor() {
    // Initialize tokens from storage on service creation
    this.initializeTokens();
  }

  /**
   * Initialize tokens from storage
   */
  private initializeTokens(): void {
    if (typeof window !== 'undefined') {
      // Get access token from storage
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken) {
        // Check if access token is still valid
        if (this.isTokenValid(accessToken)) {
          // Set authentication state to true
          this.isAuthenticatedSubject.next(true);
          this.accessTokenSubject.next(accessToken);
        } else {
          // Access token expired, clear everything
          this.clearTokens();
        }
      }
    }
  }

  /**
   * Login with mobile and OTP
   */
  login(data: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/sign-in`, data).pipe(
      tap((response: TokenResponse) => {
        this.handleTokenResponse(response);
      })
    );
  }

  /**
   * Handle successful token response
   */
  private handleTokenResponse(response: TokenResponse): void {
    debugger;
    // Store access token in memory (sessionStorage for persistence across page reloads)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('accessToken', response.accessToken);
    }
    this.accessTokenSubject.next(response.accessToken);
    
    // Store refresh token in secure storage (localStorage for now)
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
    }
    
    // Set authentication state
    this.isAuthenticatedSubject.next(true);
    
    // Extract and set user info from token
    this.setUserInfoFromToken(response.accessToken);
  }

  /**
   * Extract user info from JWT token
   */
  private setUserInfoFromToken(token: string): void {
    try {
      const payload: JwtPayload = this.decodeToken(token);
      const userInfo: UserInfo = {
        id: parseInt(payload.sub) || 0,
        email: payload.email || '',
        phone: '', // You might need to adjust this based on your token structure
        isVerified: true, // Assuming token issuance means user is verified
        verificationCode: ''
      };
      this.userInfo.set(userInfo);
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): JwtPayload {
    if (!token) {
      throw new Error('Token is null or undefined');
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }
    
    const payload = parts[1];
    return JSON.parse(atob(payload));
  }

  /**
   * Check if token is valid (not expired)
   */
  private isTokenValid(token: string): boolean {
    try {
      const payload: JwtPayload = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = localStorage.getItem('accessToken');
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<TokenResponse>(`${this.baseUrl}/refresh`, {
      accessToken: refreshToken
    }).pipe(
      tap((response: TokenResponse) => {
        this.handleTokenResponse(response);
      }),
      catchError((error) => {
        // Refresh token is invalid or expired
        this.clearTokens();
        this.router.navigate(['/auth/sign-in']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Call logout endpoint if needed
    this.http.post(`${this.baseUrl}/logout`, {}).subscribe({
      next: () => console.log('Logged out successfully'),
      error: (error) => console.error('Logout error:', error)
    });
    
    // Clear tokens and authentication state
    this.clearTokens();
    
    // Redirect to login page
    this.router.navigate(['/auth/sign-in']);
  }

  /**
   * Clear all tokens and reset authentication state
   */
  private clearTokens(): void {
    // Clear access token from memory
    this.accessTokenSubject.next(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
    }
    
    // Clear token from secure storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    
    // Reset authentication state
    this.isAuthenticatedSubject.next(false);
    this.userInfo.set(null);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get user info
   */
  getUserInfo(): UserInfo | null {
    return this.userInfo();
  }

  /**
   * Set user info
   */
  setUserInfo(userInfo: UserInfo): void {
    this.userInfo.set(userInfo);
  }

  // Keep existing methods for compatibility
  register(data: RegisterRequest, onboardingData: OnboardingDataDto | null): Observable<any> {
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
}
