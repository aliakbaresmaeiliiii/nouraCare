import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { OnboardingService } from '../shared/services/onboarding.service';
import { GetPregnantIntroStateService } from '../shared/services/get-pregnant-intro-state.service';

/**
 * Final “calculating” screen: fills 0–100%, then opens Home with ovulation day focused on the cycle SVG.
 */
@Component({
  selector: 'app-track-pregnancy-intro-step12',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step12.component.html',
  styleUrls: ['./track-pregnancy-intro-step12.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep12Component implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly cycleSettings = inject(CycleSettingsService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly introState = inject(GetPregnantIntroStateService);
  private readonly cdr = inject(ChangeDetectorRef);
  /** Browser timer handles (avoids NodeJS `Timeout` vs `number` mismatches). */
  private timer: number | null = null;
  /** Fires after 100% is shown so we never navigate before the bar/ring settles. */
  private completionTimer: number | null = null;
  private rafId: number | null = null;
  private didNavigateHome = false;
  private destroyed = false;
  progress = 0;

  /** SVG stroke-dashoffset CSS transition (~80ms); keep bar visible briefly after 100%. */
  private readonly msAfterFullBeforeNavigate = 800;

  ngOnInit(): void {
    this.timer = window.setInterval(() => {
      if (this.didNavigateHome || this.timer == null) {
        return;
      }
      const next = Math.min(100, this.progress + 1);
      this.progress = next;

      if (this.progress >= 100) {
        this.stopTickTimer();
        this.progress = 100;
        this.cdr.detectChanges();

        this.rafId = window.requestAnimationFrame(() => {
          this.rafId = null;
          if (this.destroyed || this.didNavigateHome) return;
          this.completionTimer = window.setTimeout(() => {
            this.completionTimer = null;
            if (!this.destroyed) {
              void this.navigateToHomeAfterComplete();
            }
          }, this.msAfterFullBeforeNavigate);
        });
      }
    }, 38);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopTickTimer();
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.completionTimer != null) {
      clearTimeout(this.completionTimer);
      this.completionTimer = null;
    }
  }

  get dashOffset(): number {
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    return circumference * (1 - this.progress / 100);
  }

  private stopTickTimer(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async navigateToHomeAfterComplete(): Promise<void> {
    if (this.didNavigateHome || this.progress < 100) {
      return;
    }
    this.didNavigateHome = true;
    const snapshot = this.introState.markCompleted();
    this.onboardingService
      .updateReproductiveState({
        state: 'planning',
        tryingSince: this.cycleSettings.lastPeriodStartDate() ?? undefined,
        notes: JSON.stringify({
          source: 'get-pregnant-intro',
          completedAt: snapshot.completedAt,
          answers: snapshot.answers,
        }),
      })
      .subscribe({
        error: () => {
          // Non-blocking: local mode still applies even if remote sync fails.
        },
      });
    this.cycleSettings.applyTryingToConceiveHomeMode();
    this.cycleSettings.pinSelectedViewToNextPredictedOvulation();
    await this.router.navigate(['/tabs/home'], { replaceUrl: true });
  }
}
