import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserInfo } from '../interfaces/user-info-api.interface';
import { environment } from '../../../environments/environment';
import { UserSessionService } from './user-session.service';

export interface OnboardingData {
  pregnancy_status: string;
  last_period: string;
  cycle_length: number;
  period_length: number;
  pregnancy_week?: number;
  health_goals: string;
  notifications: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserInfoService {
  private http = inject(HttpClient);
  private userSession = inject(UserSessionService);

  userInfo = signal<UserInfo | null>(null);

  saveOnboardingData(onboardingData: OnboardingData): Observable<UserInfo> {
    const userId = this.userSession.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('No user id'));
    }
    const payload = this.transformOnboardingData(onboardingData);
    return this.http
      .post<UserInfo>(
        `${environment.apiEndPoint}user/${userId}/onboarding`,
        payload,
      )
      .pipe(
        tap((response) => {
          this.userInfo.set(response);
        }),
      );
  }

  savePregnancyStatus(
    userId: number,
    pregnancyStatus: string,
  ): Observable<UserInfo> {
    return this.http
      .post<UserInfo>(`${environment.apiEndPoint}user/${userId}/onboarding`, {
        pregnancyStatus,
      })
      .pipe(
        tap((response) => {
          this.userInfo.set(response);
        }),
      );
  }

  getUserOnboardingData(userId?: number): Observable<UserInfo> {
    const targetUserId =
      userId != null ? userId : this.userSession.getCurrentUserId();
    if (!targetUserId) {
      return throwError(() => new Error('No user id'));
    }
    return this.http
      .get<UserInfo>(
        `${environment.apiEndPoint}user/${targetUserId}/onboarding`,
      )
      .pipe(
        tap((response) => {
          this.userInfo.set(response);
        }),
      );
  }

  /** @deprecated Use {@link getUserOnboardingData} — same HTTP call. */
  getUserInfo(userId: number): Observable<UserInfo> {
    return this.getUserOnboardingData(userId);
  }

  getCurrentUserInfo(): any | null {
    return this.userInfo();
  }

  private transformOnboardingData(data: OnboardingData): Partial<UserInfo> {
    const pregnancyStatus = this.mapPregnancyStatus(data.pregnancy_status);
    const healthGoals = data.health_goals ? JSON.parse(data.health_goals) : [];

    return {
      pregnancyStatus,
      lastPeriodDate: data.last_period,
      cycleLength: data.cycle_length,
      periodLength: data.period_length,
      pregnancyWeek: data.pregnancy_week,
      pregnancyProgress: data.pregnancy_week
        ? (data.pregnancy_week / 40) * 100
        : undefined,
      healthGoals,
      notificationsEnabled: data.notifications === 'yes',
    };
  }

  private mapPregnancyStatus(
    status: string,
  ): 'pregnant' | 'trying' | 'postpartum' | 'tracking' {
    switch (status) {
      case 'pregnant':
        return 'pregnant';
      case 'trying':
        return 'trying';
      case 'postpartum':
        return 'postpartum';
      case 'tracking':
        return 'tracking';
      default:
        return 'tracking';
    }
  }

  clearUserInfo(): void {
    localStorage.removeItem('userInfo');
    this.userInfo.set(null);
  }

  hasUserInfo(): boolean {
    return this.userInfo() !== null;
  }

  /**
   * Hydrate the onboarding signal from `localStorage`, or from GET onboarding when storage is empty and id is known.
   */
  loadUserInfoOnInit(): void {
    const fromStorage = this.userSession.parseUserInfoStore();
    if (fromStorage) {
      this.userInfo.set(fromStorage as unknown as UserInfo);
      return;
    }
    const userId = this.userSession.getCurrentUserId();
    if (userId > 0) {
      this.getUserOnboardingData(userId).subscribe({
        error: () => {
          /* optional: onboarding not available */
        },
      });
    }
  }

  getUserInfoSummary(): string {
    const info = this.userInfo();
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
}
