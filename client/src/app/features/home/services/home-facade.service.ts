import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { AuthService } from '@app/core/auth/services/auth';
import { DashboardCacheService } from '@app/shared/services/dashboard-cache.service';
import { TrackDataService } from '@app/shared/services/track-data.service';
import {
  HomeReproductiveUiService,
  type HomePageJourneyState,
} from '@app/features/home/services/home-reproductive-ui.service';
import { HomeJourneyBridgeService } from '@app/features/home/services/home-journey-bridge.service';
import { HomeDataService } from '@app/features/home/services/home-data.service';
import {
  HOME_SYMPTOMS_HISTORY_DAYS,
  HOME_SYMPTOMS_REFETCH_MIN_MS,
} from '@app/features/home/constants/home.constants';

/** Minimal track-day row shape used on the home symptoms strip. */
export interface HomeTrackDayRow {
  date?: string | Date;
  mood?: string;
  energy?: string;
  symptoms?: unknown;
  notes?: string;
}

/** Thrown when dashboard sync runs without a valid access token. */
export class HomeUnauthenticatedError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'HomeUnauthenticatedError';
  }
}

/**
 * Home tab data orchestration (dashboard journey + symptom history).
 * Keeps {@link HomeComponent} thinner without NgRx.
 */
@Injectable({ providedIn: 'root' })
export class HomeFacadeService {
  private readonly auth = inject(AuthService);
  private readonly dashboardCache = inject(DashboardCacheService);
  private readonly homeReproUi = inject(HomeReproductiveUiService);
  private readonly homeJourneyBridge = inject(HomeJourneyBridgeService);
  private readonly homeData = inject(HomeDataService);
  private readonly trackData = inject(TrackDataService);

  readonly recentSymptomsDays = signal<HomeTrackDayRow[]>([]);
  readonly symptomsHistoryLoading = signal(false);

  private symptomsFetchedAt = 0;
  private symptomsInFlight = false;

  /**
   * Loads dashboard + onboarding journey and returns merged {@link HomePageJourneyState}.
   * Honors journey-bridge skip (week-detail / profile save).
   */
  syncDashboardJourney(forceRemote = false): Observable<HomePageJourneyState | null> {
    if (!this.auth.getAccessToken()) {
      return throwError(() => new HomeUnauthenticatedError());
    }

    if (this.homeJourneyBridge.takeSkipNextRemoteDashboardFetch()) {
      let bridged: HomePageJourneyState | null = null;
      this.homeJourneyBridge.applySavedJourneyIfPending((state) => {
        bridged = state;
      });
      return of(bridged);
    }

    return this.dashboardCache.load(forceRemote).pipe(
      map(({ dashboard, journey }) =>
        this.homeReproUi.synchronizeFromDashboardAndJourney(dashboard, journey),
      ),
    );
  }

  /**
   * Fetches recent track-day rows for the symptoms strip (cached + throttled).
   */
  loadRecentSymptomsHistory(force = false): void {
    const userId = this.homeData.getCurrentUserId();
    if (!this.auth.getAccessToken() || userId <= 0) {
      this.recentSymptomsDays.set([]);
      return;
    }

    const now = Date.now();
    if (
      !force &&
      (this.symptomsInFlight ||
        (this.recentSymptomsDays().length > 0 &&
          now - this.symptomsFetchedAt < HOME_SYMPTOMS_REFETCH_MIN_MS))
    ) {
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - HOME_SYMPTOMS_HISTORY_DAYS);
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    this.symptomsInFlight = true;
    this.symptomsHistoryLoading.set(true);

    this.trackData
      .getTrackDaysForUserCached(userId, startDate, endDate, force)
      .pipe(
        catchError(() => of([])),
        tap((rows) => {
          this.recentSymptomsDays.set(
            Array.isArray(rows) ? (rows as HomeTrackDayRow[]) : [],
          );
          this.symptomsFetchedAt = Date.now();
        }),
        finalize(() => {
          this.symptomsInFlight = false;
          this.symptomsHistoryLoading.set(false);
        }),
      )
      .subscribe();
  }

  clearSymptomsHistory(): void {
    this.recentSymptomsDays.set([]);
    this.symptomsFetchedAt = 0;
    this.trackData.invalidateTrackDaysRangeCache();
  }
}
