import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap, catchError, map, shareReplay } from 'rxjs';
import { AuthService } from '@app/core/auth/services/auth';
import { AdminMeDto } from '../models/admin-api.models';
import { AdminApiService } from './admin-api.service';

const PANEL_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

/**
 * Caches GET /admin/me for the admin shell + route guard.
 * Panel access: SUPER_ADMIN or ADMIN (seed default is SUPER_ADMIN).
 */
@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  private readonly api = inject(AdminApiService);
  private readonly auth = inject(AuthService);

  readonly me = signal<AdminMeDto | null>(null);
  private inflight: Observable<AdminMeDto | null> | null = null;

  /** Probe session; returns user when panel-eligible, otherwise null. */
  ensureSession(): Observable<AdminMeDto | null> {
    if (!this.auth.isAuthenticated()) {
      this.clear();
      return of(null);
    }

    const authUserId = this.auth.getUserInfo()?.id;
    const cached = this.me();
    if (
      cached &&
      PANEL_ROLES.has(cached.role) &&
      (authUserId == null || cached.id === authUserId)
    ) {
      return of(cached);
    }
    if (this.inflight) {
      return this.inflight;
    }

    this.inflight = this.api.getMe().pipe(
      map((user) => (PANEL_ROLES.has(user.role) ? user : null)),
      tap((user) => {
        this.me.set(user);
        this.inflight = null;
      }),
      catchError(() => {
        this.me.set(null);
        this.inflight = null;
        return of(null);
      }),
      shareReplay(1),
    );

    return this.inflight;
  }

  clear(): void {
    this.me.set(null);
    this.inflight = null;
  }

  canAccessPanel(): boolean {
    const role = this.me()?.role;
    return !!role && PANEL_ROLES.has(role);
  }

  isSuperAdmin(): boolean {
    return this.me()?.role === 'SUPER_ADMIN';
  }
}
