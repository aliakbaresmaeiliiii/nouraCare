import { Injectable, computed, signal } from '@angular/core';
import type { HomePageJourneyState } from './home-reproductive-ui.service';

/**
 * Week-detail pushes the computed home journey row here (signal). Home applies it in an {@link effect}
 * so the UI updates even when Ionic skips {@code ionViewWillEnter} for the embedded tab.
 * Also skips one remote dashboard GET so a stale response cannot overwrite this payload.
 */
@Injectable({ providedIn: 'root' })
export class HomeJourneyBridgeService {
  private readonly _savedJourneyFromWeekDetail =
    signal<HomePageJourneyState | null>(null);
  private readonly _skipNextRemoteDashboardFetch = signal(false);

  /** Read-only: home effect subscribes to this. */
  readonly savedJourneyFromWeekDetail = this._savedJourneyFromWeekDetail.asReadonly();

  readonly hasSavedJourneyFromWeekDetail = computed(
    () => this._savedJourneyFromWeekDetail() !== null,
  );

  /**
   * Call from week-detail after PATCH with the same merge rules as home (synchronous, before navigate).
   */
  pushJourneyStateFromWeekDetail(state: HomePageJourneyState): void {
    this._savedJourneyFromWeekDetail.set(state);
    this._skipNextRemoteDashboardFetch.set(true);
  }

  /** Used by the home effect: read-once apply. */
  consumeSavedJourneyFromWeekDetail(): HomePageJourneyState | null {
    const value = this._savedJourneyFromWeekDetail();
    this._savedJourneyFromWeekDetail.set(null);
    return value;
  }

  /** Home sync calls first; skips one forkJoin after a week-detail push. */
  takeSkipNextRemoteDashboardFetch(): boolean {
    const v = this._skipNextRemoteDashboardFetch();
    if (v) {
      this._skipNextRemoteDashboardFetch.set(false);
    }
    return v;
  }
}
