import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  PeriodLogData,
  ReproductiveStatusService,
} from './reproductive-status.service';
import { CycleSettingsService } from './cycle-settings.service';
import { PeriodHistoryService } from './period-history.service';
import { normalizeLmpInput } from '../utils/pregnancy-lmp.util';
import { UserInfoService } from './user-info.service';
import { AuthService } from '../../auth/services/auth';

@Injectable({ providedIn: 'root' })
export class PeriodCycleStateService {
  private reproductiveStatusService = inject(ReproductiveStatusService);
  private cycleSettings = inject(CycleSettingsService);
  private periodHistory = inject(PeriodHistoryService);
  private userInfoService = inject(UserInfoService);
  private authService = inject(AuthService);

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
    this.patchOnboardingLastPeriodBestEffort(iso);
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
