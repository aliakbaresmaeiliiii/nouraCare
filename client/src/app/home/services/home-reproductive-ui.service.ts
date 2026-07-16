import { inject, Injectable } from '@angular/core';
import { CycleSettingsService } from '../../shared/services/cycle-settings.service';
import { UserInfoService } from '../../shared/services/user-info.service';
import { UserInfo } from '../../shared/interfaces/user-info-api.interface';
import { DashboardResponse } from '../../shared/services/onboarding.service';
import type { DashboardCyclePhaseGuide } from '../../shared/services/onboarding.service';
import { normalizeLmpInput } from '../../shared/utils/pregnancy-lmp.util';
import { PeriodHistoryService } from '../../shared/services/period-history.service';

/** Journey fields the home page binds after each dashboard + onboarding sync. */
export interface HomePageJourneyState {
  userStatus: string;
  isPregnant: boolean;
  isPostpartum: boolean;
  isMenopause: boolean;
  menopauseStage?: 'perimenopause' | 'menopause';
  daysSinceLastPeriod?: number | null;
  menopauseInsight?: string | null;
  /** Set only when API / merge defines week (omit for cycle/postpartum so prior UI values stay). */
  pregnancyWeek?: number;
  /** 0–6, from dashboard; omitted until known. */
  pregnancyDay?: number;
  pregnancyProgress?: number;
  /** Server indicates pregnant without saved LMP yet. */
  needsPregnancyInput?: boolean;
  lastMenstrualPeriodIso?: string | null;
  dashboardTips?: string[];
  /** Dashboard `insight` for pregnant users (trimester + week); optional on older servers. */
  pregnancyDashboardInsight?: string | null;
  periodStartDate: Date | null;
  /** Call {@link updateCycleDay} on the component when true. */
  cycleDayDirty: boolean;
  /** Server cycle dashboard (planning / cycle). */
  dashboardCycleDay?: number | null;
  dashboardCycleLength?: number | null;
  dashboardNextPeriodIso?: string | null;
  dashboardOvulationIso?: string | null;
  dashboardFertileWindow?: DashboardFertileWindow | null;
  dashboardCycleInsight?: string | null;
  /** Personalized phase guide from GET /me/dashboard (cycle/planning). */
  dashboardPhaseGuide?: DashboardCyclePhaseGuide | null;
  /**
   * True when journey said pregnant/postpartum but dashboard was still default `cycle`.
   * Home should PATCH reproductive state once so later loads stay correct.
   */
  needsReproductivePersist?: boolean;
}

type DashboardFertileWindow = NonNullable<DashboardResponse['fertileWindow']>;

@Injectable({ providedIn: 'root' })
export class HomeReproductiveUiService {
  private cycleSettings = inject(CycleSettingsService);
  private userInfoService = inject(UserInfoService);
  private periodHistory = inject(PeriodHistoryService);

  /**
   * Applies dashboard, merges legacy onboarding row, finalizes pregnancy storage flags.
   * Mutates {@link CycleSettingsService} to match.
   */
  synchronizeFromDashboardAndJourney(
    dashboard: DashboardResponse,
    journey: UserInfo | null | undefined,
  ): HomePageJourneyState {
    let state = this.applyDashboardResponse(dashboard);
    // Registration used to persist journey without reproductive_state; GET dashboard
    // then defaulted to `cycle`. Prefer completed journey pregnant/postpartum intent.
    state = this.reconcileJourneyOverDefaultCycle(dashboard, journey, state);
    this.mergeJourneyLastPeriodIntoCycleState(journey, state);
    this.hydratePeriodStartFromLocalCycle(state);
    this.finalizePregnancyStorageFromDashboard(
      state.isPregnant
        ? { ...dashboard, state: 'pregnant' }
        : state.isPostpartum
          ? { ...dashboard, state: 'postpartum' }
          : dashboard,
      state,
    );
    return state;
  }

  /**
   * When dashboard is still the default `cycle` but onboarding journey says
   * pregnant / postpartum / has child, bind Home to that intent.
   */
  private reconcileJourneyOverDefaultCycle(
    dashboard: DashboardResponse,
    journey: UserInfo | null | undefined,
    state: HomePageJourneyState,
  ): HomePageJourneyState {
    if (dashboard.state !== 'cycle' || !journey?.pregnancyStatus) {
      return state;
    }
    const status = String(journey.pregnancyStatus).toUpperCase();
    if (status === 'PREGNANT') {
      this.cycleSettings.setUserStatus('Pregnant');
      this.cycleSettings.setPregnancyStatus(true);
      this.cycleSettings.setPostpartumStatus(false);
      this.cycleSettings.setMenopauseStatus(false);
      const lmpIso = this.journeyLastPeriodIso(journey);
      if (lmpIso) {
        this.cycleSettings.setLastPeriodStart(lmpIso);
        const stats = this.computePregnancyStatsFromLmpIso(lmpIso);
        if (stats) {
          this.cycleSettings.setPregnancyWeek(stats.week);
          this.cycleSettings.setPregnancyProgress(stats.progress);
          return {
            userStatus: 'Pregnant',
            isPregnant: true,
            isPostpartum: false,
            isMenopause: false,
            pregnancyWeek: stats.week,
            pregnancyDay: stats.day,
            pregnancyProgress: stats.progress,
            needsPregnancyInput: false,
            lastMenstrualPeriodIso: lmpIso,
            dashboardTips: [],
            pregnancyDashboardInsight: null,
            periodStartDate: null,
            cycleDayDirty: false,
            needsReproductivePersist: true,
          };
        }
      }
      return {
        userStatus: 'Pregnant',
        isPregnant: true,
        isPostpartum: false,
        isMenopause: false,
        needsPregnancyInput: true,
        dashboardTips: [],
        pregnancyDashboardInsight: null,
        periodStartDate: null,
        cycleDayDirty: false,
        needsReproductivePersist: true,
      };
    }
    if (status === 'POSTPARTUM' || status === 'HAS_CHILD') {
      this.cycleSettings.setUserStatus('Postpartum');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(true);
      this.cycleSettings.setMenopauseStatus(false);
      return {
        userStatus: 'Postpartum',
        isPregnant: false,
        isPostpartum: true,
        isMenopause: false,
        periodStartDate: null,
        cycleDayDirty: false,
        needsReproductivePersist: true,
      };
    }
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
      this.cycleSettings.setMenopauseStatus(false);

      if (dashboard.needsPregnancyInput || dashboard.week == null) {
        return {
          userStatus: 'Pregnant',
          isPregnant: true,
          isPostpartum: false,
          isMenopause: false,
          needsPregnancyInput: true,
          dashboardTips: [],
          pregnancyDashboardInsight: null,
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
        isMenopause: false,
        pregnancyWeek: week,
        pregnancyDay: day,
        pregnancyProgress,
        needsPregnancyInput: false,
        lastMenstrualPeriodIso: lmpIso ?? dashboard.lastMenstrualPeriod ?? null,
        dashboardTips: dashboard.tips?.length ? dashboard.tips : [],
        pregnancyDashboardInsight: dashboard.insight?.trim()
          ? dashboard.insight.trim()
          : null,
        periodStartDate: null,
        cycleDayDirty: false,
      };
    }

    if (dashboard.state === 'postpartum') {
      this.cycleSettings.setUserStatus('Postpartum');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(true);
      this.cycleSettings.setMenopauseStatus(false);
      return {
        userStatus: 'Postpartum',
        isPregnant: false,
        isPostpartum: true,
        isMenopause: false,
        periodStartDate: null,
        cycleDayDirty: false,
      };
    }

    if (dashboard.state === 'menopause') {
      const stage = dashboard.menopauseStage ?? 'perimenopause';
      this.cycleSettings.applyMenopauseHomeMode(stage);
      const lastIso = dashboard.lastPeriodDate ?? null;
      if (lastIso) {
        this.cycleSettings.setLastPeriodStart(lastIso);
      }
      return {
        userStatus: 'Menopause',
        isPregnant: false,
        isPostpartum: false,
        isMenopause: true,
        menopauseStage: stage,
        daysSinceLastPeriod: dashboard.daysSinceLastPeriod ?? null,
        menopauseInsight: dashboard.insight?.trim() ? dashboard.insight.trim() : null,
        dashboardTips: dashboard.tips?.length ? dashboard.tips : [],
        periodStartDate: lastIso ? new Date(`${lastIso}T12:00:00`) : null,
        cycleDayDirty: !!lastIso,
      };
    }

    // Server defaults reproductive_state to `cycle`; `planning` is TTC. Both use the same
    // home layout (cycle ring, metrics). `userStatus === 'Trying to Conceive'` gates that UI.
    const userStatus =
      dashboard.state === 'planning'
        ? 'Trying to Conceive'
        : dashboard.state === 'cycle'
          ? 'Cycle Tracking'
          : 'Cycle Tracking';
    this.cycleSettings.setUserStatus(userStatus);
    this.cycleSettings.setPostpartumStatus(false);
    this.cycleSettings.setPregnancyStatus(false);
    this.cycleSettings.setMenopauseStatus(false);

    if (dashboard.state === 'planning') {
      this.cycleSettings.setGetPregnantProfileCardPending(false);
    }

    const cycleLen = dashboard.cycleLength;
    if (cycleLen != null && Number.isFinite(Number(cycleLen))) {
      this.cycleSettings.setCycleLength(Math.round(Number(cycleLen)));
    }

    if (
      dashboard.avgPeriodLength != null &&
      Number.isFinite(Number(dashboard.avgPeriodLength))
    ) {
      this.cycleSettings.setPeriodLength(
        Math.round(Number(dashboard.avgPeriodLength)),
      );
    }

    if (
      dashboard.cycleDay != null &&
      Number.isFinite(dashboard.cycleDay) &&
      dashboard.cycleDay >= 1
    ) {
      const localIso = this.resolvePreferredPeriodStartIso();
      if (localIso) {
        // Period picker / cycle calendar writes localStorage first — do not infer LMP from stale cycleDay.
        periodStartDate = new Date(`${localIso}T12:00:00`);
        cycleDayDirty = true;
      } else {
        const histIso = normalizeLmpInput(
          this.periodHistory.getEntries()[0]?.lastPeriodStartDate,
        );
        if (histIso) {
          periodStartDate = new Date(`${histIso}T12:00:00`);
          cycleDayDirty = true;
          this.cycleSettings.setLastPeriodStart(histIso);
        } else {
          const today = new Date();
          today.setHours(12, 0, 0, 0);
          const start = new Date(today);
          start.setDate(
            today.getDate() - (Math.round(Number(dashboard.cycleDay)) - 1),
          );
          periodStartDate = start;
          cycleDayDirty = true;
          const y = start.getFullYear();
          const m = String(start.getMonth() + 1).padStart(2, '0');
          const d = String(start.getDate()).padStart(2, '0');
          this.cycleSettings.setLastPeriodStart(`${y}-${m}-${d}`);
        }
      }
    }

    const nextPeriodIso =
      dashboard.nextPeriod != null
        ? String(dashboard.nextPeriod).includes('T')
          ? String(dashboard.nextPeriod).split('T')[0]
          : String(dashboard.nextPeriod).slice(0, 10)
        : null;

    return {
      userStatus,
      isPregnant: false,
      isPostpartum: false,
      isMenopause: false,
      periodStartDate,
      cycleDayDirty,
      dashboardCycleDay: dashboard.cycleDay ?? null,
      dashboardCycleLength:
        cycleLen != null && Number.isFinite(Number(cycleLen))
          ? Math.round(Number(cycleLen))
          : null,
      dashboardNextPeriodIso: nextPeriodIso,
      dashboardOvulationIso: dashboard.ovulationDate ?? null,
      dashboardFertileWindow: dashboard.fertileWindow ?? null,
      dashboardCycleInsight: dashboard.insight?.trim() ? dashboard.insight.trim() : null,
      dashboardTips: dashboard.tips?.length ? dashboard.tips : [],
      dashboardPhaseGuide: dashboard.phaseGuide ?? null,
    };
  }

  /**
   * When the server journey has a last-period date but local cycle storage does not,
   * copy it so the home ring, metrics, and “start tracking” gate stay consistent.
   * Does not infer LMP from {@link DashboardResponse.nextPeriod} (that hid the CTA without user input).
   */
  /** When the dashboard merge did not set `periodStartDate`, bind it from saved cycle settings (common on logged-in first paint). */
  private hydratePeriodStartFromLocalCycle(state: HomePageJourneyState): void {
    if (state.isPregnant || state.isPostpartum || state.isMenopause) {
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
    const cycleIso = this.cycleSettings.lastPeriodStartDate();
    if (!cycleIso) {
      this.cycleSettings.setLastPeriodStart(iso);
    }

    // Critical precedence: period logs (cycle settings) must win over stale onboarding journey.
    const preferredIso = this.cycleSettings.lastPeriodStartDate() || iso;
    if (!state.periodStartDate && preferredIso) {
      state.periodStartDate = new Date(`${preferredIso}T12:00:00`);
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
    if (dashboard.state !== 'menopause' && !state.isMenopause) {
      this.cycleSettings.setMenopauseStatus(false);
    }
  }

  /** Local cycle settings + period history beat dashboard cycleDay inference on refresh. */
  private resolvePreferredPeriodStartIso(): string | null {
    const fromSettings = normalizeLmpInput(
      this.cycleSettings.lastPeriodStartDate() ?? undefined,
    );
    if (fromSettings) {
      return fromSettings;
    }
    const newest = this.periodHistory.getEntries()[0];
    if (!newest?.lastPeriodStartDate) {
      return null;
    }
    return normalizeLmpInput(newest.lastPeriodStartDate) ?? null;
  }
}
