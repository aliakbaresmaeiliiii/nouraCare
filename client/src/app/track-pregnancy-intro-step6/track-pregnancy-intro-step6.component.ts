import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { gestationalWeekFromLmp, isoDateOnly, normalizeLmpInput } from '../shared/utils/pregnancy-lmp.util';

@Component({
  selector: 'app-track-pregnancy-intro-step6',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step6.component.html',
  styleUrls: ['./track-pregnancy-intro-step6.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep6Component implements OnInit, OnDestroy {
  private router = inject(Router);
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  progress = 27;
  pregnancyWeek: number | null = null;
  periodElapsedLabel = '';
  showFirstPregnancyDialog = false;
  private askedFirstPregnancy = false;
  private readonly maxProgress = 100;

  ngOnInit(): void {
    this.computePregnancyTiming();
    this.startProgress();
  }

  private computePregnancyTiming(): void {
    const lmpIso = this.readLmpIsoFromStorage();
    if (!lmpIso) {
      this.pregnancyWeek = null;
      this.periodElapsedLabel = '';
      return;
    }

    const lmpDate = this.isoToUtcDate(lmpIso);
    const todayUtc = this.getTodayUtcDate();
    const diffDays = Math.max(
      0,
      Math.floor((todayUtc.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    this.pregnancyWeek = Math.max(1, gestationalWeekFromLmp(lmpIso));
    this.periodElapsedLabel = `Since last period: ${weeks}w ${days}d`;
  }

  private readLmpIsoFromStorage(): string | null {
    const directKeys = ['pregnancyStartDate', 'lastPeriodDate', 'lmp_date'];
    for (const key of directKeys) {
      const normalized = normalizeLmpInput(localStorage.getItem(key));
      if (normalized) {
        return normalized;
      }
    }

    const userInfoRaw = localStorage.getItem('userInfo');
    if (userInfoRaw) {
      try {
        const userInfo = JSON.parse(userInfoRaw) as {
          lastPeriodDate?: unknown;
          last_period?: unknown;
          lmp_date?: unknown;
        };
        return normalizeLmpInput(
          userInfo.lmp_date ?? userInfo.lastPeriodDate ?? userInfo.last_period,
        );
      } catch {
        // Keep this flow resilient even if stored data is malformed.
      }
    }

    return null;
  }

  private isoToUtcDate(iso: string): Date {
    const normalizedIso = isoDateOnly(iso);
    if (!normalizedIso) {
      return this.getTodayUtcDate();
    }
    const [year, month, day] = normalizedIso.split('-').map((part) => Number(part));
    return new Date(Date.UTC(year, month - 1, day));
  }

  private getTodayUtcDate(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private startProgress(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    this.progressTimer = setInterval(() => {
      if (this.showFirstPregnancyDialog) {
        return;
      }

      this.progress = Math.min(this.maxProgress, this.progress + 1);

      if (!this.askedFirstPregnancy && this.progress >= 30) {
        this.askedFirstPregnancy = true;
        this.showFirstPregnancyDialog = true;
        return;
      }

      if (this.progress >= this.maxProgress) {
        this.stopProgress();
        void this.router.navigate(['/track-pregnancy-intro-step7']);
      }
    }, 55);
  }

  onFirstPregnancyAnswer(_isFirstPregnancy: boolean): void {
    this.showFirstPregnancyDialog = false;
  }

  private stopProgress(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  get dashOffset(): number {
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    return circumference * (1 - this.progress / 100);
  }

  get pregnancyWeekLabel(): string {
    if (!this.pregnancyWeek) {
      return 'Calculating pregnancy week';
    }
    return `${this.pregnancyWeek} weeks pregnant`;
  }

  ngOnDestroy(): void {
    this.stopProgress();
  }
}
