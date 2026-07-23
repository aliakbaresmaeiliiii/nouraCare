import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, ReplaySubject, share, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface OnboardingJourneyRequestOptions {
  force?: boolean;
}
import {
  ApiEnvelope,
  UserInfo,
} from '@app/shared/interfaces/user-info-api.interface';
import { environment } from '../../../environments/environment';
import { UserSessionService } from '@app/shared/services/user-session.service';
import { AuthService } from '@app/core/auth/services/auth';
import { normalizeLmpInput } from '@app/shared/utils/pregnancy-lmp.util';

export interface OnboardingData {
  pregnancy_status: string;
  last_period: string;
  cycle_length: number;
  period_length: number;
  pregnancy_week?: number;
  health_goals: string;
  notifications: string | boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserInfoService {
  private http = inject(HttpClient);
  private userSession = inject(UserSessionService);
  private authService = inject(AuthService);

  /** Last journey payload from `GET user/me/onboarding` (and PATCH). */
  onboardingJourney = signal<UserInfo | null>(null);
  /** Coalesces concurrent GET user/me/onboarding subscribers into one HTTP call. */
  private onboardingShared$: Observable<UserInfo> | null = null;

  /** @deprecated Prefer {@link onboardingJourney}; kept for edit-profile merges. */
  userInfo = signal<any>(null);

  saveOnboardingData(onboardingData: OnboardingData): Observable<UserInfo> {
    if (!this.authService.getAccessToken()) {
      return throwError(() => new Error('Not authenticated'));
    }
    const payload = this.transformOnboardingData(onboardingData);
    return this.http
      .patch<ApiEnvelope<UserInfo>>(
        `${environment.apiEndPoint}user/me/onboarding`,
        payload,
      )
      .pipe(
        map((res) => this.unwrap(res)),
        tap((data) => {
          this.invalidateOnboardingCache();
          this.onboardingJourney.set(data);
        }),
      );
  }

  /**
   * Partial PATCH for signed-in user (`user/me/onboarding`).
   * Use after local cycle actions (e.g. “Start tracking”) so GET onboarding matches server.
   */
  patchMeOnboarding(patch: {
    pregnancyStatus?: string;
    lastPeriodDate?: string;
    cycleLength?: number;
    periodLength?: number;
  }): Observable<UserInfo> {
    if (!this.authService.getAccessToken()) {
      return throwError(() => new Error('Not authenticated'));
    }
    const body: Record<string, unknown> = { ...patch };
    if (patch.lastPeriodDate != null && patch.lastPeriodDate !== '') {
      const raw = patch.lastPeriodDate;
      body['lastPeriodDate'] = raw.includes('T')
        ? raw
        : `${raw}T12:00:00.000Z`;
    }
    return this.http
      .patch<ApiEnvelope<UserInfo>>(
        `${environment.apiEndPoint}user/me/onboarding`,
        body,
      )
      .pipe(
        map((res) => this.unwrap(res)),
        tap((data) => this.onboardingJourney.set(data)),
      );
  }

  savePregnancyStatus(
    _userId: number,
    pregnancyStatus: string,
  ): Observable<UserInfo> {
    if (!this.authService.getAccessToken()) {
      return throwError(() => new Error('Not authenticated'));
    }
    const server = this.mapClientStatusToServer(pregnancyStatus);
    return this.http
      .patch<ApiEnvelope<UserInfo>>(
        `${environment.apiEndPoint}user/me/onboarding`,
        { pregnancyStatus: server },
      )
      .pipe(
        map((res) => this.unwrap(res)),
        tap((data) => this.onboardingJourney.set(data)),
      );
  }

  /**
   * Authenticated: loads the signed-in user's journey from `GET user/me/onboarding`.
   * The optional userId parameter is ignored (kept for call-site compatibility).
   */
  getUserOnboardingData(
    _userId?: number,
    options?: OnboardingJourneyRequestOptions,
  ): Observable<UserInfo> {
    if (!this.authService.getAccessToken()) {
      return throwError(() => new Error('Not authenticated'));
    }
    if (options?.force) {
      this.invalidateOnboardingCache();
    }
    if (!this.onboardingShared$) {
      this.onboardingShared$ = this.http
        .get<ApiEnvelope<UserInfo>>(
          `${environment.apiEndPoint}user/me/onboarding`,
        )
        .pipe(
          map((res) => this.unwrap(res)),
          tap((data) => this.onboardingJourney.set(data)),
          share({
            connector: () => new ReplaySubject<UserInfo>(1),
            resetOnRefCountZero: true,
            resetOnError: true,
            resetOnComplete: true,
          }),
        );
    }
    return this.onboardingShared$;
  }

  invalidateOnboardingCache(): void {
    this.onboardingShared$ = null;
  }

  /** @deprecated Use {@link getUserOnboardingData} — same HTTP call. */
  getUserInfo(userId: number): Observable<UserInfo> {
    return this.getUserOnboardingData(userId);
  }

  /** Auth/session store shape from localStorage (not the onboarding journey signal). */
  getCurrentUserInfo(): any | null {
    return this.userSession.parseUserInfoStore();
  }

  private unwrap<T>(res: ApiEnvelope<T>): T {
    if (res?.data === undefined || res?.data === null) {
      throw new Error('Invalid API response');
    }
    return res.data;
  }

  private transformOnboardingData(data: OnboardingData): Record<string, unknown> {
    const pregnancyStatus = this.mapClientStatusToServer(data.pregnancy_status);
    const healthGoals = this.parseHealthGoalsField(data.health_goals);
    const notificationsEnabled =
      data.notifications === true ||
      data.notifications === 'yes' ||
      data.notifications === 'true';
    const out: Record<string, unknown> = {
      pregnancyStatus,
      lastPeriodDate: data.last_period || undefined,
      cycleLength: data.cycle_length,
      periodLength: data.period_length,
      pregnancyWeek: data.pregnancy_week,
      notificationsEnabled,
    };
    if (data.pregnancy_week != null) {
      out['pregnancyProgress'] = String((data.pregnancy_week / 40) * 100);
    }
    if (healthGoals.length > 0) {
      out['healthGoals'] = healthGoals;
    }
    return out;
  }

  private parseHealthGoalsField(raw: unknown): string[] {
    if (raw == null || raw === '') {
      return [];
    }
    if (typeof raw === 'string') {
      try {
        const p = JSON.parse(raw) as unknown;
        return Array.isArray(p)
          ? p.filter((x): x is string => typeof x === 'string')
          : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private mapClientStatusToServer(status: string): string {
    const s = (status || '').toLowerCase().replace(/\s+/g, '_');
    const map: Record<string, string> = {
      pregnant: 'PREGNANT',
      trying: 'PLANNING_PREGNANCY',
      trying_to_conceive: 'PLANNING_PREGNANCY',
      tracking: 'PLANNING_PREGNANCY',
      postpartum: 'POSTPARTUM',
      has_child: 'HAS_CHILD',
      parent: 'HAS_CHILD',
      not_planning: 'NOT_PLANNING',
    };
    if (map[s]) {
      return map[s];
    }
    const up = (status || '').toUpperCase();
    if (
      [
        'PLANNING_PREGNANCY',
        'PREGNANT',
        'NOT_PLANNING',
        'HAS_CHILD',
        'POSTPARTUM',
      ].includes(up)
    ) {
      return up;
    }
    return 'PLANNING_PREGNANCY';
  }

  clearUserInfo(): void {
    localStorage.removeItem('userInfo');
    this.userInfo.set(null);
    this.onboardingJourney.set(null);
  }

  hasUserInfo(): boolean {
    return this.onboardingJourney() !== null;
  }

  /**
   * When authenticated, loads journey from the API into {@link onboardingJourney}.
   */
  loadUserInfoOnInit(): void {
    if (this.authService.getAccessToken()) {
      this.getUserOnboardingData().subscribe({
        error: () => {
          /* optional: onboarding not available */
        },
      });
    }
  }

  getUserInfoSummary(): string {
    const info = this.onboardingJourney();
    if (!info || !info.pregnancyStatus) {
      return 'No user info available';
    }
    const status =
      info.pregnancyStatus.charAt(0).toUpperCase() +
      info.pregnancyStatus.slice(1);
    const cycle = `${info.cycleLength}-day cycle`;
    const period = `${info.periodLength}-day period`;
    return `${status} • ${cycle} • ${period}`;
  }

  /**
   * Local-first override used after period logging so stale onboarding payload
   * never wins over freshly saved cycle data in active screens.
   */
  applyLocalPeriodOverride(lastPeriodDateIso: string): void {
    const canonical = normalizeLmpInput(lastPeriodDateIso);
    if (!canonical) {
      return;
    }
    this.onboardingJourney.update((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        lastPeriodDate: `${canonical}T12:00:00.000Z`,
      };
    });
  }
}
