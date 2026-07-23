import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { DashboardCacheService } from '@app/shared/services/dashboard-cache.service';
import { Router } from '@angular/router';
import { OnboardingDataDto } from '@app/shared/services/onboarding.service';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { PENDING_INVITE_CODE_KEY } from '@app/shared/constants/growth.constants';
import { LoginRequest } from '@app/core/auth/login/model/login-request-interface';
import { RegisterRequest } from '@app/core/auth/login/model/register-request-interface';
import { User } from '@app/core/auth/login/model/uesr-interface';
import { JwtPayload, TokenResponse } from '@app/core/auth/models/token.interface';
import {
  DEFAULT_APP_LANGUAGE,
  LANGUAGE_SWITCHING_ENABLED,
} from '@app/shared/services/language.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private injector = inject(Injector);
  private baseUrl = environment.apiEndPoint + 'auth';

  // Store Access Token in memory using BehaviorSubject
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

  private lastSessionVerifyAt = 0;
  private visibilityListenerAttached = false;

  constructor() {
    this.initializeTokens();
    this.attachSessionVerifyOnAppVisible();
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
          this.isAuthenticatedSubject.next(true);
          this.accessTokenSubject.next(accessToken);
          this.attachSessionVerifyOnAppVisible();
        } else {
          // Access token expired, clear everything
          this.clearTokens();
        }
      }
    }
  }

  /**
   * Unified OTP — step 1: send code to email or phone (sms.ir).
   */
  requestOtp(data: {
    email?: string;
    phoneNumber?: string;
  }): Observable<TokenResponse> {
    const body: { email?: string; phoneNumber?: string } = {};
    const email = data.email?.trim().toLowerCase();
    const phoneNumber = data.phoneNumber?.trim();
    if (email) body.email = email;
    if (phoneNumber) body.phoneNumber = phoneNumber;

    return this.http.post<TokenResponse>(
      `${this.baseUrl}/otp/request`,
      body,
      this.languageHttpOptions(),
    );
  }

  /**
   * Unified OTP — step 2: verify code and store tokens.
   */
  verifyOtp(data: {
    email?: string;
    phoneNumber?: string;
    otp: string;
  }): Observable<TokenResponse> {
    const body: { email?: string; phoneNumber?: string; otp: string } = {
      otp: String(data.otp).trim(),
    };
    const email = data.email?.trim().toLowerCase();
    const phoneNumber = data.phoneNumber?.trim();
    if (email) body.email = email;
    if (phoneNumber) body.phoneNumber = phoneNumber;

    return this.http.post<TokenResponse>(`${this.baseUrl}/otp/verify`, body).pipe(
      tap((response: TokenResponse) => {
        if (response?.data?.accessToken) {
          this.handleTokenResponse(response);
        }
      }),
    );
  }

  /**
   * @deprecated Prefer requestOtp / verifyOtp. Kept for older callers.
   */
  login(data: LoginRequest): Observable<TokenResponse> {
    if (data.otp?.trim()) {
      return this.verifyOtp({
        email: data.email,
        phoneNumber: data.phoneNumber,
        otp: data.otp,
      });
    }
    return this.requestOtp({
      email: data.email,
      phoneNumber: data.phoneNumber,
    });
  }

  /**
   * Social login (Google / Apple)
   */
  socialLogin(
    provider: 'google' | 'apple',
    options: {
      email?: string;
      fullName?: string;
      idToken?: string;
      accessToken?: string;
    },
  ): Observable<TokenResponse> {
    const payload: {
      provider: 'google' | 'apple';
      email?: string;
      fullName?: string;
      idToken?: string;
      accessToken?: string;
      inviteCode?: string;
    } = { provider };

    if (options.email?.trim()) {
      payload.email = options.email.trim();
    }
    if (options.fullName?.trim()) {
      payload.fullName = options.fullName.trim();
    }
    if (options.idToken?.trim()) {
      payload.idToken = options.idToken.trim();
    }
    if (options.accessToken?.trim()) {
      payload.accessToken = options.accessToken.trim();
    }

    if (typeof sessionStorage !== 'undefined') {
      const inv = sessionStorage.getItem(PENDING_INVITE_CODE_KEY)?.trim();
      if (inv) {
        payload.inviteCode = inv;
      }
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
    const accessToken = response.data.accessToken;
    if (!accessToken) {
      return;
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('accessToken', accessToken);
    }
    this.accessTokenSubject.next(accessToken);

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      const existing = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          ...existing,
          ...response.data,
          refreshToken: response.data.refreshToken,
        }),
      );
    }
    this.isAuthenticatedSubject.next(true);
    this.setUserInfoFromToken(accessToken);
    this.attachSessionVerifyOnAppVisible();
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
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = JSON.parse(
      localStorage.getItem('userInfo') || '{}',
    )?.refreshToken;

    const finishLocalLogout = () => {
      this.clearTokens();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      }
      void this.router.navigate(['/auth/sign-in']);
    };

    if (refreshToken && accessToken) {
      this.http.post(`${this.baseUrl}/logout`, { refreshToken, accessToken }).subscribe({
        next: () => finishLocalLogout(),
        error: () => finishLocalLogout(),
      });
    } else {
      finishLocalLogout();
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
    try {
      this.injector.get(DashboardCacheService).invalidate();
    } catch {
      /* non-fatal */
    }
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

    if (!payload.inviteCode && typeof sessionStorage !== 'undefined') {
      const inv = sessionStorage.getItem(PENDING_INVITE_CODE_KEY)?.trim();
      if (inv) {
        payload.inviteCode = inv;
      }
    }

    return this.http
      .post(`${this.baseUrl}/register`, payload, this.languageHttpOptions())
      .pipe(
        tap((response: any) => {
          if (response?.data?.accessToken) {
            this.handleTokenResponse(response);
          }
        }),
      );
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
    return this.http.post<TokenResponse>(`${this.baseUrl}/verify-email`, data).pipe(
      tap((response: TokenResponse) => {
        if (response?.data?.accessToken) {
          this.handleTokenResponse(response);
        }
      }),
    );
  }

  resendOtp(data: { email: string }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/resend-verification`,
      data,
      this.languageHttpOptions(),
    );
  }

  private languageHttpOptions(): { headers: { 'Accept-Language': string } } {
    return {
      headers: {
        'Accept-Language': this.getClientLocale(),
      },
    };
  }

  private getClientLocale(): string {
    if (!LANGUAGE_SWITCHING_ENABLED) {
      return DEFAULT_APP_LANGUAGE;
    }
    if (typeof localStorage === 'undefined') {
      return DEFAULT_APP_LANGUAGE;
    }
    return localStorage.getItem('selectedLanguage') || DEFAULT_APP_LANGUAGE;
  }

  /**
   * When the app returns to foreground, verify the session with a lightweight GET
   * (not refresh-token rotation, which was running every 5 minutes before).
   */
  private attachSessionVerifyOnAppVisible(): void {
    if (
      this.visibilityListenerAttached ||
      typeof document === 'undefined' ||
      !this.isAuthenticated()
    ) {
      return;
    }
    this.visibilityListenerAttached = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.verifyUserExistenceIfDue();
      }
    });
  }

  private verifyUserExistenceIfDue(): void {
    if (!this.isAuthenticated() || !this.getAccessToken()) {
      return;
    }
    const now = Date.now();
    if (now - this.lastSessionVerifyAt < 5 * 60 * 1000) {
      return;
    }
    this.lastSessionVerifyAt = now;
    this.http.get(`${this.baseUrl}/verify-user-exists`).subscribe({
      error: (err: { status?: number }) => {
        if (err?.status === 401) {
          this.logout();
        }
      },
    });
  }
}
