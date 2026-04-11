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

  /**
   * Previously merged `GET user/me/onboarding` into cycle/planning dashboard rows.
   * That overwrote a fresh `PATCH /me/state` (e.g. not pregnant) when onboarding still said PREGNANT.
   * {@link DashboardResponse.state} is authoritative; do not infer mode from the onboarding row here.
   */
  private mergeLegacyOnboardingJourney(
    _dashboard: DashboardResponse,
    _journey: UserInfo | null | undefined,
    _state: HomePageJourneyState,
  ): void {}

  private finalizePregnancyStorageFromDashboard(
    dashboard: DashboardResponse,
    state: HomePageJourneyState,
  ): void {
    if (state.isPregnant || dashboard.state === 'pregnant') {
      return;
    }
    this.cycleSettings.setPregnancyStatus(false);
    this.cycleSettings.setPregnancyWeek(12);
    this.cycleSettings.setPregnancyProgress(0);
  }
}
