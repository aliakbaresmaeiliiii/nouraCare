import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  PeriodLogData,
  ReproductiveStatusService,
} from '@app/shared/services/reproductive-status.service';
import { CycleSettingsService } from '@app/shared/services/cycle-settings.service';
import { PeriodHistoryService } from '@app/shared/services/period-history.service';
import { normalizeLmpInput } from '@app/shared/utils/pregnancy-lmp.util';
import { UserInfoService } from '@app/shared/services/user-info.service';
import { AuthService } from '@app/core/auth/services/auth';
import { DashboardCacheService } from '@app/shared/services/dashboard-cache.service';

@Injectable({ providedIn: 'root' })
export class PeriodCycleStateService {
  private reproductiveStatusService = inject(ReproductiveStatusService);
  private cycleSettings = inject(CycleSettingsService);
  private periodHistory = inject(PeriodHistoryService);
  private userInfoService = inject(UserInfoService);
  private authService = inject(AuthService);
  private dashboardCache = inject(DashboardCacheService);

  private readonly latestPeriodIso = signal<string | null>(null);
  private readonly lastFetchedAtMs = signal<number>(0);
  private readonly loading = signal(false);

  periodStartIso = this.latestPeriodIso.asReadonly();
  isLoading = this.loading.asReadonly();

  async savePeriodStart(
    userId: number,
    payload: {
      lastPeriodDateIso: string;
      averagePeriodDuration: number;
      mood?: string;
      notes?: string;
    },
  ): Promise<void> {
    const canonicalIso = normalizeLmpInput(payload.lastPeriodDateIso);
    if (!canonicalIso) {
      return;
    }

    // Optimistic local state so all observers stay in sync instantly.
    this.applyPeriodLocally(canonicalIso);

    if (userId <= 0) {
      return;
    }

    const request: PeriodLogData = {
      lastPeriodDate: canonicalIso,
      mood: payload.mood ?? '',
      notes: payload.notes ?? '',
      averagePeriodDuration: payload.averagePeriodDuration,
    };

    try {
      await firstValueFrom(
        this.reproductiveStatusService.createPeriodLog(userId, request),
      );
      this.lastFetchedAtMs.set(Date.now());
      this.dashboardCache.invalidate();
    } catch (error) {
      console.error('Failed to persist period log:', error);
    }
  }

  private applyPeriodLocally(iso: string): void {
    this.latestPeriodIso.set(iso);
    this.cycleSettings.setLastPeriodStart(iso);
    this.cycleSettings.setSelectedCycleViewDate(null);
    this.periodHistory.addEntry(iso);
    this.userInfoService.applyLocalPeriodOverride(iso);
    this.patchOnboardingLocalStorage(iso);
    this.patchOnboardingLastPeriodBestEffort(iso);
  }

  /** Keep offline onboarding snapshot aligned so journey merge cannot revert on refresh. */
  private patchOnboardingLocalStorage(iso: string): void {
    try {
      const raw = localStorage.getItem('onboarding_data');
      if (!raw) {
        return;
      }
      const data = JSON.parse(raw) as Record<string, unknown>;
      data['last_period'] = iso;
      data['lmp_date'] = iso;
      localStorage.setItem('onboarding_data', JSON.stringify(data));
    } catch {
      // Non-blocking
    }
  }

  private patchOnboardingLastPeriodBestEffort(iso: string): void {
    if (!this.authService.getAccessToken()) {
      return;
    }
    this.userInfoService
      .patchMeOnboarding({ lastPeriodDate: iso })
      .subscribe({
        error: () => {
          // Non-blocking: local + period-log API state already updated.
        },
      });
  }
}
