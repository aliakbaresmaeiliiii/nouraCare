import { inject, Injectable } from '@angular/core';
import { CycleSettingsService } from '../../shared/services/cycle-settings.service';
import { UserInfoService } from '../../shared/services/user-info.service';
import { UserInfo } from '../../shared/interfaces/user-info-api.interface';
import { DashboardResponse } from '../../shared/services/onboarding.service';

/** Journey fields the home page binds after each dashboard + onboarding sync. */
export interface HomePageJourneyState {
  userStatus: string;
  isPregnant: boolean;
  isPostpartum: boolean;
  /** Set only when API / merge defines week (omit for cycle/postpartum so prior UI values stay). */
  pregnancyWeek?: number;
  pregnancyProgress?: number;
  periodStartDate: Date | null;
  /** Call {@link updateCycleDay} on the component when true. */
  cycleDayDirty: boolean;
}

@Injectable({ providedIn: 'root' })
export class HomeReproductiveUiService {
  private cycleSettings = inject(CycleSettingsService);
  private userInfoService = inject(UserInfoService);

  /**
   * Applies dashboard, merges legacy onboarding row, finalizes pregnancy storage flags.
   * Mutates {@link CycleSettingsService} to match.
   */
  synchronizeFromDashboardAndJourney(
    dashboard: DashboardResponse,
    journey: UserInfo | null | undefined,
  ): HomePageJourneyState {
    const state = this.applyDashboardResponse(dashboard);
    this.mergeLegacyOnboardingJourney(dashboard, journey, state);
    this.finalizePregnancyStorageFromDashboard(dashboard, state);
    return state;
  }

  showStartTrackingSection(state: {
    userStatus: string;
    isPregnant: boolean;
    isPostpartum: boolean;
  }): boolean {
    if (state.isPregnant || state.isPostpartum) {
      return false;
    }
    if (this.cycleSettings.isPregnant() || this.cycleSettings.isPostpartum()) {
      return false;
    }
    if (state.userStatus && state.userStatus !== 'Not Set') {
      return false;
    }
    return true;
  }

  private applyDashboardResponse(
    dashboard: DashboardResponse,
  ): HomePageJourneyState {
    let cycleDayDirty = false;
    let periodStartDate: Date | null = null;

    if (dashboard.state === 'pregnant') {
      const week = dashboard.week ?? 4;
      const pregnancyProgress = Math.min(100, Math.round((week / 40) * 100));
      this.cycleSettings.setUserStatus('Pregnant');
      this.cycleSettings.setPregnancyStatus(true);
      this.cycleSettings.setPostpartumStatus(false);
      this.cycleSettings.setPregnancyWeek(week);
      this.cycleSettings.setPregnancyProgress(pregnancyProgress);
      return {
        userStatus: 'Pregnant',
        isPregnant: true,
        isPostpartum: false,
        pregnancyWeek: week,
        pregnancyProgress,
        periodStartDate: null,
        cycleDayDirty: false,
      };
    }

    if (dashboard.state === 'postpartum') {
      this.cycleSettings.setUserStatus('Postpartum');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(true);
      return {
        userStatus: 'Postpartum',
        isPregnant: false,
        isPostpartum: true,
        periodStartDate: null,
        cycleDayDirty: false,
      };
    }

    const userStatus =
      dashboard.state === 'planning' ? 'Trying to Conceive' : 'Cycle Tracking';
    this.cycleSettings.setUserStatus(userStatus);
    this.cycleSettings.setPostpartumStatus(false);

    if (dashboard.nextPeriod) {
      const nextPeriod = new Date(dashboard.nextPeriod);
      const cycleLen = this.cycleSettings.cycleLength() || 28;
      const lastPeriod = new Date(nextPeriod);
      lastPeriod.setDate(lastPeriod.getDate() - cycleLen);
      const iso = lastPeriod.toISOString().split('T')[0];
      this.cycleSettings.setLastPeriodStart(iso);
      periodStartDate = new Date(iso + 'T12:00:00');
      cycleDayDirty = true;
    }

    return {
      userStatus,
      isPregnant: false,
      isPostpartum: false,
      periodStartDate,
      cycleDayDirty,
    };
  }

  private mergeLegacyOnboardingJourney(
    dashboard: DashboardResponse,
    journey: UserInfo | null | undefined,
    state: HomePageJourneyState,
  ): void {
    if (dashboard.state === 'pregnant' || dashboard.state === 'postpartum') {
      return;
    }
    const j = journey ?? this.userInfoService.onboardingJourney();
    if (!j) {
      return;
    }
    const status = String(j.pregnancyStatus ?? '')
      .toUpperCase()
      .replace(/\s+/g, '_');
    const rawWeek = j.pregnancyWeek ?? dashboard.week;
    const weekHint =
      rawWeek != null && rawWeek !== undefined
        ? Math.min(40, Math.max(4, Number(rawWeek) || 4))
        : null;
    const explicitlyPregnant = status === 'PREGNANT';
    const blockedImplyFromWeek =
      status === 'POSTPARTUM' ||
      status === 'HAS_CHILD' ||
      status === 'NOT_PLANNING';
    const impliedPregnantByWeek =
      weekHint != null && weekHint >= 4 && !blockedImplyFromWeek;

    if (explicitlyPregnant || impliedPregnantByWeek) {
      const week = weekHint ?? 4;
      const pregnancyProgress = Math.min(100, Math.round((week / 40) * 100));
      this.cycleSettings.setUserStatus('Pregnant');
      this.cycleSettings.setPregnancyStatus(true);
      this.cycleSettings.setPostpartumStatus(false);
      this.cycleSettings.setPregnancyWeek(week);
      this.cycleSettings.setPregnancyProgress(pregnancyProgress);
      state.userStatus = 'Pregnant';
      state.isPregnant = true;
      state.isPostpartum = false;
      state.pregnancyWeek = week;
      state.pregnancyProgress = pregnancyProgress;
      return;
    }
    if (status === 'POSTPARTUM') {
      this.cycleSettings.setUserStatus('Postpartum');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(true);
      state.userStatus = 'Postpartum';
      state.isPregnant = false;
      state.isPostpartum = true;
    }
  }

  private finalizePregnancyStorageFromDashboard(
    dashboard: DashboardResponse,
    state: HomePageJourneyState,
  ): void {
    if (state.isPregnant || dashboard.state === 'pregnant') {
      return;
    }
    this.cycleSettings.setPregnancyStatus(false);
  }
}
