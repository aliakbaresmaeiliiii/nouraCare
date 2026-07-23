import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';
import type { UserInfo } from '@app/shared/interfaces/user-info-api.interface';
import {
  DashboardResponse,
  OnboardingService,
} from '@app/shared/services/onboarding.service';
import { UserInfoService } from '@app/shared/services/user-info.service';
import { AuthService } from '@app/core/auth/services/auth';

export interface HomeDashboardBundle {
  dashboard: DashboardResponse;
  journey: UserInfo | null;
}

/**
 * Short-lived cache for home dashboard + onboarding journey.
 * Avoids duplicate GETs on every Ionic tab re-enter (ionViewWillEnter).
 * Not NgRx — a thin facade over existing services + signals.
 */
@Injectable({ providedIn: 'root' })
export class DashboardCacheService {
  private readonly onboarding = inject(OnboardingService);
  private readonly userInfo = inject(UserInfoService);
  private readonly auth = inject(AuthService);

  /** Last successful bundle (read-only for debugging/UI if needed). */
  readonly bundle = signal<HomeDashboardBundle | null>(null);

  private lastFetchedAt = 0;
  private inFlight: Observable<HomeDashboardBundle> | null = null;

  /** How long tab switches reuse the same server snapshot without refetching. */
  private readonly ttlMs = 45_000;

  load(force = false): Observable<HomeDashboardBundle> {
    if (!this.auth.getAccessToken()) {
      return throwError(() => new Error('Not authenticated'));
    }

    const now = Date.now();
    const cached = this.bundle();
    if (
      !force &&
      cached &&
      now - this.lastFetchedAt < this.ttlMs
    ) {
      return of(cached);
    }

    if (!force && this.inFlight) {
      return this.inFlight;
    }

    if (force) {
      this.invalidate();
    }

    this.inFlight = forkJoin({
      dashboard: this.onboarding.getDashboard(
        force ? { force: true } : undefined,
      ),
      journey: this.userInfo
        .getUserOnboardingData(undefined, force ? { force: true } : undefined)
        .pipe(catchError(() => of<UserInfo | null>(null))),
    }).pipe(
      tap((result) => {
        this.bundle.set(result);
        this.lastFetchedAt = Date.now();
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
      finalize(() => {
        this.inFlight = null;
      }),
    );

    return this.inFlight;
  }

  invalidate(): void {
    this.lastFetchedAt = 0;
    this.bundle.set(null);
    this.inFlight = null;
    this.onboarding.invalidateDashboardCache();
    this.userInfo.invalidateOnboardingCache();
  }
}
