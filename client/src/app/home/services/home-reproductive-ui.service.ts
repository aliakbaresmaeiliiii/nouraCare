import { inject, Injectable } from '@angular/core';
import { CycleSettingsService } from '../../shared/services/cycle-settings.service';
import { UserInfoService } from '../../shared/services/user-info.service';
import { UserInfo } from '../../shared/interfaces/user-info-api.interface';
import { DashboardResponse } from '../../shared/services/onboarding.service';
import { normalizeLmpInput } from '../../shared/utils/pregnancy-lmp.util';

/** Journey fields the home page binds after each dashboard + onboarding sync. */
export interface HomePageJourneyState {
  userStatus: string;
  isPregnant: boolean;
  isPostpartum: boolean;
  /** Set only when API / merge defines week (omit for cycle/postpartum so prior UI values stay). */
  pregnancyWeek?: number;
  /** 0–6, from dashboard; omitted until known. */
  pregnancyDay?: number;
  pregnancyProgress?: number;
  /** Server indicates pregnant without saved LMP yet. */
  needsPregnancyInput?: boolean;
  lastMenstrualPeriodIso?: string | null;
  dashboardTips?: string[];
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

  private applyDashboardResponse(
    dashboard: DashboardResponse,
  ): HomePageJourneyState {
    let cycleDayDirty = false;
    let periodStartDate: Date | null = null;

    if (dashboard.state === 'pregnant') {
      this.cycleSettings.setUserStatus('Pregnant');
      this.cycleSettings.setPregnancyStatus(true);
      this.cycleSettings.setPostpartumStatus(false);

      if (dashboard.needsPregnancyInput || dashboard.week == null) {
        return {
          userStatus: 'Pregnant',
          isPregnant: true,
          isPostpartum: false,
          needsPregnancyInput: true,
          periodStartDate: null,
          cycleDayDirty: false,
        };
      }

      const week = dashboard.week;
      const day = dashboard.day ?? 0;
      const rawProgress = dashboard.progress ?? 0;
      const pregnancyProgress = Math.min(100, Math.round(rawProgress * 100));
      this.cycleSettings.setPregnancyWeek(week);
      this.cycleSettings.setPregnancyProgress(pregnancyProgress);
      const lmpIso = normalizeLmpInput(dashboard.lastMenstrualPeriod ?? undefined);
      if (lmpIso) {
        this.cycleSettings.setLastPeriodStart(lmpIso);
      }
      return {
        userStatus: 'Pregnant',
        isPregnant: true,
        isPostpartum: false,
        pregnancyWeek: week,
        pregnancyDay: day,
        pregnancyProgress,
        needsPregnancyInput: false,
        lastMenstrualPeriodIso: lmpIso ?? dashboard.lastMenstrualPeriod ?? null,
        dashboardTips: dashboard.tips?.length ? dashboard.tips : [],
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

    // Server defaults reproductive_state to `cycle`; `planning` is TTC. Both use the same
    // home layout (cycle ring, metrics). `userStatus === 'Trying to Conceive'` gates that UI.
    const userStatus =
      dashboard.state === 'planning' || dashboard.state === 'cycle'
        ? 'Trying to Conceive'
        : 'Cycle Tracking';
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
    if (state.isPregnant) {
      // Best-practice precedence:
      // 1) Dashboard pregnancy data (reproductive domain) is authoritative when complete.
      // 2) Fallback to onboarding journey LMP only when dashboard lacks usable pregnancy timeline.
      if (
        !state.needsPregnancyInput &&
        state.pregnancyWeek != null &&
        state.lastMenstrualPeriodIso
      ) {
        return;
      }
      this.cycleSettings.setLastPeriodStart(iso);
      state.lastMenstrualPeriodIso = iso;
      const stats = this.computePregnancyStatsFromLmpIso(iso);
      if (stats) {
        state.pregnancyWeek = stats.week;
        state.pregnancyDay = stats.day;
        state.pregnancyProgress = stats.progress;
        state.needsPregnancyInput = false;
        this.cycleSettings.setPregnancyWeek(stats.week);
        this.cycleSettings.setPregnancyProgress(stats.progress);
      }
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

  private computePregnancyStatsFromLmpIso(
    lmpIso: string,
  ): { week: number; day: number; progress: number } | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lmpIso);
    if (!m) {
      return null;
    }
    const lmpUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    if (todayUtc < lmpUtc) {
      return null;
    }
    const days = Math.floor((todayUtc - lmpUtc) / 86400000);
    const week = Math.min(42, Math.max(1, Math.floor(days / 7) + 1));
    const day = days % 7;
    const progress = Math.min(100, Math.round((days / 280) * 100));
    return { week, day, progress };
  }

  private finalizePregnancyStorageFromDashboard(
    dashboard: DashboardResponse,
    state: HomePageJourneyState,
  ): void {
    if (state.isPregnant || dashboard.state === 'pregnant') {
      return;
    }
    this.cycleSettings.setPregnancyStatus(false);
    this.cycleSettings.setPregnancyWeek(0);
    this.cycleSettings.setPregnancyProgress(0);
  }
}
