import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingDataDto } from '../../shared/services/onboarding.service';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../login/model/login-request-interface';
import { RegisterRequest } from '../login/model/register-request-interface';
import { User } from '../login/model/uesr-interface';
import { JwtPayload, TokenResponse } from '../models/token.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = environment.apiEndPoint + 'auth';

  // Store Access Token in memory using BehaviorSubject
  // private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private accessTokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('accessToken'),
  );
  public accessToken$ = this.accessTokenSubject.asObservable();

  // User info signal
  userInfo = signal<User | null>(null);

  // Authentication state signal
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Computed signal for current user
  currentUser = computed(() => this.userInfo());

  constructor() {
    // Initialize tokens from storage on service creation
    this.initializeTokens();

    // Set up periodic user existence check (every 5 minutes)
    // Only if we're in a browser environment and user is authenticated
    if (typeof window !== 'undefined' && this.isAuthenticated()) {
      setInterval(
        () => {
          this.verifyUserExistence();
        },
        5 * 60 * 1000,
      ); // 5 minutes
    }
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
      }),
    );
  }

  /**
   * Social login (Google / Apple)
   */
  socialLogin(
    provider: 'google' | 'apple',
    email: string,
    fullName?: string,
  ): Observable<TokenResponse> {
    const payload: {
      provider: 'google' | 'apple';
      email: string;
      fullName?: string;
    } = { provider, email };
    if (fullName?.trim()) {
      payload.fullName = fullName.trim();
    }

    return this.http
      .post<TokenResponse>(`${this.baseUrl}/social-login`, payload)
      .pipe(
        tap((response: TokenResponse) => {
          this.handleTokenResponse(response);
        }),
      );
  }

  /**
   * Normalize user info payload from social login response
   */
  setUserInfoFromSocialResponse(response: TokenResponse): void {
    if (response?.data?.accessToken) {
      this.handleTokenResponse(response);
    }

    const user = response?.data?.user;
    if (!user) {
      return;
    }

    this.setUserInfo({
      id: user.id,
      email: user.email,
      phone: user.phone ?? '',
      name: user['name'],
      profileImage: user['profileImage'],
      isVerified: user.isVerified,
      status: user['status'],
      city: user['city'],
      birthday: user['birthday'],
      createdAt: user['createdAt'],
    } as User);
  }

  /**
   * Handle successful token response
   */
  private handleTokenResponse(response: TokenResponse): void {
    // Store access token in memory (sessionStorage for persistence across page reloads)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('accessToken', response.data.accessToken);
    }
    this.accessTokenSubject.next(response.data.accessToken);

    // Store refresh token in secure storage (localStorage for now)
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    // Set authentication state
    this.isAuthenticatedSubject.next(true);

    // Extract and set user info from token
    this.setUserInfoFromToken(response.data.accessToken);
  }

  /**
   * Extract user info from JWT token
   */
  private setUserInfoFromToken(token: string): void {
    try {
      const payload: JwtPayload = this.decodeToken(token);
      const userInfo: User = {
        id: parseInt(payload.sub) || 0,
        email: payload.email || '',
        phone: '', // You might need to adjust this based on your token structure
        isVerified: true, // Assuming token issuance means user is verified
      };
      this.userInfo.set(userInfo);
    } catch (error) {
      // Failed to decode token
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = JSON.parse(
      localStorage.getItem('userInfo') || '{}',
    )?.refreshToken;

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<TokenResponse>(`${this.baseUrl}/refresh`, {
        refreshToken: refreshToken,
      })
      .pipe(
        tap((response: TokenResponse) => {
          this.handleTokenResponse(response);
        }),
        catchError((error) => {
          // Refresh token is invalid or expired
          this.clearTokens();
          this.router.navigate(['/auth/sign-in']);
          return throwError(() => error);
        }),
      );
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
   * Logout user
   */
  logout(): void {
    // Get access token from storage to use for logout API call
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = JSON.parse(
      localStorage.getItem('userInfo') || '{}',
    )?.refreshToken;
    // Call logout endpoint with access token
    if (refreshToken && accessToken) {
      this.http.post(`${this.baseUrl}/logout`, { refreshToken, accessToken }).subscribe({
        next: () => {
          // Successfully logged out on server
          this.clearTokens();
          this.router.navigate(['/auth/sign-in']);
        },
        error: () => {
          // Even if logout fails, clear local tokens
          this.clearTokens();
          this.router.navigate(['/auth/sign-in']);
        },
      });
    }
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
    return localStorage.getItem('accessToken') || '';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get user info
   */
  getUserInfo(): User | null {
    return this.userInfo();
  }

  /**
   * Set user info
   */
  setUserInfo(userInfo: User): void {
    this.userInfo.set(userInfo);
    // Also set authentication state to true when user info is set
    this.isAuthenticatedSubject.next(true);
  }

  // Keep existing methods for compatibility
  register(
    data: RegisterRequest,
    onboardingData: OnboardingDataDto | null,
    onboardingSessionToken?: string | null,
  ): Observable<any> {
    const payload: any = {
      ...data,
      onboardingData,
    };

    // Include onboarding session token if provided
    if (onboardingSessionToken) {
      payload.onboardingSessionToken = onboardingSessionToken;
    }

    return this.http.post(`${this.baseUrl}/register`, payload);
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

  verifyEmail(data: { email: string; code: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-email`, data);
  }

  resendOtp(data: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-otp`, data);
  }

  /**
   * Verify that the user still exists in the database
   * This is called periodically to check if user data was deleted
   */
  private verifyUserExistence(): void {
    if (!this.isAuthenticated()) {
      return;
    }

    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return;
    }

    try {
      const payload: JwtPayload = this.decodeToken(accessToken);
      const userId = parseInt(payload.sub) || 0;

      if (userId > 0) {
        // Make a lightweight API call to verify user existence
        // This could be a simple endpoint like /auth/verify-user or /users/{id}/exists
        // For now, we'll use the refresh token endpoint as it requires authentication
        this.refreshToken().subscribe({
          next: () => {
            // User still exists and token is valid
          },
          error: () => {
            // User doesn't exist or token is invalid
            this.logout();
          },
        });
      }
    } catch (error) {
      // If we can't decode the token, log out
      this.logout();
    }
  }
}
