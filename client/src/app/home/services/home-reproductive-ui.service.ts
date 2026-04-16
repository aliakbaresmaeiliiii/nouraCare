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
    this.mergeJourneyLastPeriodIntoCycleState(journey, state);
    this.hydratePeriodStartFromLocalCycle(state);
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
    // Show until local cycle storage has a last-period start (LMP).
    // Journey is merged into cycle settings in the same sync; using the signal here caused
    // stale journey data or timing to hide the CTA when the user still had nothing local.
    if (this.cycleSettings.lastPeriodStartDate()) {
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

    return {
      userStatus,
      isPregnant: false,
      isPostpartum: false,
      periodStartDate,
      cycleDayDirty,
    };
  }

  /**
   * When the server journey has a last-period date but local cycle storage does not,
   * copy it so the home ring, metrics, and “start tracking” gate stay consistent.
   * Does not infer LMP from {@link DashboardResponse.nextPeriod} (that hid the CTA without user input).
   */
  /** When the dashboard merge did not set `periodStartDate`, bind it from saved cycle settings (common on logged-in first paint). */
  private hydratePeriodStartFromLocalCycle(state: HomePageJourneyState): void {
    if (state.isPregnant || state.isPostpartum) {
      return;
    }
    if (state.periodStartDate) {
      return;
    }
    const iso = this.cycleSettings.lastPeriodStartDate();
    if (!iso) {
      return;
    }
    const day = iso.includes('T') ? iso.split('T')[0] : iso.slice(0, 10);
    state.periodStartDate = new Date(`${day}T12:00:00`);
    state.cycleDayDirty = true;
  }

  private mergeJourneyLastPeriodIntoCycleState(
    journey: UserInfo | null | undefined,
    state: HomePageJourneyState,
  ): void {
    const iso = this.journeyLastPeriodIso(journey);
    if (!iso) {
      return;
    }
    if (!this.cycleSettings.lastPeriodStartDate()) {
      this.cycleSettings.setLastPeriodStart(iso);
    }
    if (!state.periodStartDate) {
      state.periodStartDate = new Date(`${iso}T12:00:00`);
      state.cycleDayDirty = true;
    }
  }

  private journeyLastPeriodIso(journey: UserInfo | null | undefined): string | null {
    const raw = journey?.lastPeriodDate;
    if (raw == null || raw === '') {
      return null;
    }
    if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) {
        return null;
      }
      return s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
    }
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
      return raw.toISOString().split('T')[0];
    }
    return null;
  }

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
