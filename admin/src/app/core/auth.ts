import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from './api';

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

const ACCESS_KEY = 'dh_admin_access';
const REFRESH_KEY = 'dh_admin_refresh';
const USER_KEY = 'dh_admin_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly userSignal = signal<AdminUser | null>(this.readUser());
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal() && !!this.getAccessToken());

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  requestOtp(email: string): Observable<{ otpSent?: boolean; accessToken?: string }> {
    return this.api.post<AuthTokens & { otpSent?: boolean }>('/auth/sign-in', { email }).pipe(
      tap((data) => {
        if (data?.accessToken && data?.user) {
          this.persistSession(data);
        }
      }),
    );
  }

  verifyOtp(email: string, otp: string): Observable<AdminUser> {
    return this.api.post<AuthTokens>('/auth/sign-in', { email, otp }).pipe(
      map((data) => {
        if (!data?.accessToken || !data?.user) {
          throw new Error('Invalid login response');
        }
        if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPER_ADMIN') {
          throw new Error('Admin access required');
        }
        this.persistSession(data);
        return data.user;
      }),
    );
  }

  /** Completes passwordless login when server returns tokens without OTP. */
  completeIfTokens(data: Partial<AuthTokens> & { otpSent?: boolean }): AdminUser | null {
    if (data?.accessToken && data?.user) {
      if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPER_ADMIN') {
        throw new Error('Admin access required');
      }
      this.persistSession(data as AuthTokens);
      return data.user;
    }
    return null;
  }

  refreshSession(): Observable<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(false);
    }
    return this.api
      .post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken })
      .pipe(
        tap((tokens) => {
          localStorage.setItem(ACCESS_KEY, tokens.accessToken);
          localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
        }),
        map(() => true),
        catchError(() => {
          this.clearSession();
          return of(false);
        }),
      );
  }

  loadMe(): Observable<AdminUser | null> {
    if (!this.getAccessToken()) {
      return of(null);
    }
    return this.api.get<AdminUser>('/admin/me').pipe(
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.userSignal.set(user);
      }),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken && this.getAccessToken()) {
      this.api.post('/auth/logout', { refreshToken }).subscribe({
        error: () => undefined,
      });
    }
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  assertAdminOrThrow(user: AdminUser): void {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      this.clearSession();
      throw new Error('Admin access required');
    }
  }

  private persistSession(data: AuthTokens): void {
    this.assertAdminOrThrow(data.user);
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    this.userSignal.set(data.user);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
  }

  private readUser(): AdminUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AdminUser) : null;
    } catch {
      return null;
    }
  }
}
