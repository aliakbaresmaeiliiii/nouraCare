import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  PeriodLogData,
  PeriodLogResponseDto,
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

  private readonly cacheTtlMs = 60_000;
  private readonly latestPeriodIso = signal<string | null>(null);
  private readonly lastFetchedAtMs = signal<number>(0);
  private readonly loading = signal(false);

  periodStartIso = this.latestPeriodIso.asReadonly();
  isLoading = this.loading.asReadonly();

  // async ensureLatestPeriodFromApi(
  //   userId: number,
  //   opts?: { force?: boolean },
  // ): Promise<string | null> {
  //   if (userId <= 0) {
  //     return this.getCurrentLocalPeriodIso();
  //   }

  //   const now = Date.now();
  //   const force = !!opts?.force;
  //   const hasFreshCache =
  //     !force &&
  //     this.latestPeriodIso() != null &&
  //     now - this.lastFetchedAtMs() < this.cacheTtlMs;

  //   if (hasFreshCache) {
  //     return this.latestPeriodIso();
  //   }

  //   this.loading.set(true);
  //   try {
  //     const logs = await firstValueFrom(
  //       this.reproductiveStatusService.getPeriodLogs(userId),
  //     );
  //     const latestIso = this.extractLatestIso(logs);
  //     if (latestIso) {
  //       this.applyPeriodLocally(latestIso);
  //     }
  //     this.lastFetchedAtMs.set(Date.now());
  //     return latestIso;
  //   } catch {
  //     return this.getCurrentLocalPeriodIso();
  //   } finally {
  //     this.loading.set(false);
  //   }
  // }

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

  private extractLatestIso(logs: PeriodLogResponseDto[] | null | undefined): string | null {
    const latest = Array.isArray(logs) && logs.length > 0 ? logs[0] : null;
    return normalizeLmpInput(latest?.lastPeriodDate ?? null);
  }

  private getCurrentLocalPeriodIso(): string | null {
    const inMemory = this.latestPeriodIso();
    if (inMemory) {
      return inMemory;
    }
    return this.cycleSettings.lastPeriodStartDate();
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
