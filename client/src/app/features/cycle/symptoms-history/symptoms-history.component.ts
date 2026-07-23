import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { TrackDataService } from '@app/shared/services/track-data.service';
import { UserSessionService } from '@app/shared/services/user-session.service';
import { SymptomsUIService } from '@app/features/cycle/symptoms-tracker/services/symptoms-ui.service';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { TranslationService } from '@app/shared/services/translation.service';
import { LanguageService } from '@app/shared/services/language.service';

@Component({
  selector: 'app-symptoms-history',
  templateUrl: './symptoms-history.component.html',
  styleUrls: ['./symptoms-history.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS]
})
export class SymptomsHistoryComponent implements OnInit {
  private router = inject(Router);
  private trackDataService = inject(TrackDataService);
  private userSession = inject(UserSessionService);
  private symptomsUIService = inject(SymptomsUIService);
  private translation = inject(TranslationService);
  private languageService = inject(LanguageService);

  symptomsHistory: any[] = [];
  loading: boolean = true;
  daysTrackedLabel = '';

  ngOnInit() {
    this.languageService.currentLanguage$.subscribe(() => this.refreshLabels());
    this.loadSymptomsHistory();
  }

  private refreshLabels(): void {
    this.daysTrackedLabel = this.translation.translateParams('symptomsHistory.daysTracked', {
      count: this.symptomsHistory.length,
    });
  }

  moreSymptomsLabel(count: number): string {
    return this.translation.translateParams('symptomsHistory.moreSymptoms', { count });
  }

  loadSymptomsHistory() {
    this.loading = true;
    const userId = this.userSession.getCurrentUserId();
    if (userId <= 0) {
      this.symptomsHistory = [];
      this.refreshLabels();
      this.loading = false;
      return;
    }

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 29);

    /** Must match symptoms tracker: local calendar YYYY-MM-DD (not UTC via toISOString). */
    const endDate = this.symptomsUIService.formatDateForInput(end);
    const startDate = this.symptomsUIService.formatDateForInput(start);

    /** Hung requests never complete → `finalize()` never runs and the spinner stays forever. */
    const loadTimeoutMs = 25_000;

    this.trackDataService
      .getTrackDaysForUser(userId, startDate, endDate)
      .pipe(
        timeout(loadTimeoutMs),
        catchError((err: unknown) => {
          console.error('Error loading symptoms history:', err);
          return of([]);
        }),
      )
      .subscribe({
        next: (rows) => {
          const normalized = this.toHistoryRows(rows);
          if (normalized.length > 0) {
            this.symptomsHistory = normalized;
            this.refreshLabels();
            this.loading = false;
            return;
          }

          // Fallback: some API versions ignore / mishandle range params but return data without them.
          this.trackDataService
            .getTrackDaysForUser(userId)
            .pipe(
              timeout(loadTimeoutMs),
              catchError((err: unknown) => {
                console.error('Error loading fallback symptoms history:', err);
                return of([]);
              }),
            )
            .subscribe((fallbackRows) => {
              this.symptomsHistory = this.toHistoryRows(fallbackRows);
              this.refreshLabels();
              this.loading = false;
            });
        },
        error: (err) => {
          console.error('symptoms-history: subscription error', err);
          this.symptomsHistory = [];
          this.refreshLabels();
          this.loading = false;
        },
      });
  }

  private toHistoryRows(rows: unknown): Record<string, unknown>[] {
    try {
      let list: unknown = rows;
      if (!Array.isArray(list) && list && typeof list === 'object') {
        const obj = list as Record<string, unknown>;
        if (Array.isArray(obj['data'])) {
          list = obj['data'];
        } else if (Array.isArray(obj['rows'])) {
          list = obj['rows'];
        } else if (Array.isArray(obj['items'])) {
          list = obj['items'];
        }
      }
      const safeRows = Array.isArray(list) ? list : [];
      return safeRows
        .filter((row) => row !== null && typeof row === 'object')
        .map((row) => this.normalizeHistoryRow(row as Record<string, unknown>));
    } catch (e) {
      console.error('symptoms-history: failed to normalize rows', e);
      return [];
    }
  }

  /** Ensure template-friendly shapes (calendar date string + parsed symptom list). */
  private normalizeHistoryRow(row: Record<string, unknown>): Record<string, unknown> {
    const dateStr = this.toCalendarDate(
      row['date'] as string | Date | undefined,
    );
    let symptoms: unknown = row['symptoms'];
    if (typeof symptoms === 'string') {
      try {
        symptoms = JSON.parse(symptoms);
      } catch {
        symptoms = [];
      }
    }
    if (!Array.isArray(symptoms)) {
      symptoms = [];
    }

    let mood = row['mood'];
    let energy = row['energy'];
    if (typeof mood === 'string' && mood.trim().startsWith('{')) {
      try {
        mood = JSON.parse(mood);
      } catch {
        /* keep string */
      }
    }
    if (typeof mood === 'object' && mood !== null && 'label' in (mood as object)) {
      mood = (mood as { label?: string }).label ?? mood;
    }
    if (typeof energy === 'string' && energy.trim().startsWith('{')) {
      try {
        energy = JSON.parse(energy);
      } catch {
        /* keep string */
      }
    }
    if (typeof energy === 'object' && energy !== null && 'label' in (energy as object)) {
      energy = (energy as { label?: string }).label ?? energy;
    }

    return {
      ...row,
      date: dateStr,
      symptoms,
      mood,
      energy,
    };
  }

  /**
   * Normalize API `date` (ISO strings like 2026-04-17T16:00:00.000Z) to local calendar YYYY-MM-DD.
   * Do not use toISOString() for the calendar day — that uses UTC and can mismatch the tracked day.
   */
  private toCalendarDate(value: string | Date | undefined): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    const d = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(d.getTime())) {
      return typeof value === 'string' ? value.split('T')[0] : '';
    }
    return this.symptomsUIService.formatDateForInput(d);
  }

  getMoodIcon(mood: string): string {
    const moodIcons: { [key: string]: string } = {
      'excellent': 'happy-outline',
      'great': 'happy-outline',
      'good': 'happy-outline',
      'okay': 'remove-outline',
      'not_great': 'sad-outline',
      'poor': 'sad-outline',
      'terrible': 'sad-outline'
    };
    return moodIcons[mood] || 'remove-outline';
  }

  getEnergyIcon(energy: string): string {
    const energyIcons: { [key: string]: string } = {
      'high': 'flash-outline',
      'medium': 'battery-half-outline',
      'low': 'battery-dead-outline'
    };
    return energyIcons[energy] || 'help-outline';
  }

  /** Parse plain YYYY-MM-DD at noon local so labels match the calendar column, not UTC midnight quirks. */
  private parseCalendarDay(dateLike: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateLike)) {
      const [y, m, d] = dateLike.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
    return new Date(dateLike);
  }

  private dateLocale(): string {
    const lang = this.languageService.getCurrentLanguage();
    if (lang === 'fa') return 'fa-IR';
    if (lang === 'zh') return 'zh-CN';
    if (lang === 'ms') return 'ms-MY';
    return 'en-US';
  }

  formatDate(dateString: string): string {
    const date = this.parseCalendarDay(dateString);
    return date.toLocaleDateString(this.dateLocale(), {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  getDayName(dateString: string): string {
    const date = this.parseCalendarDay(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return this.translation.translate('symptomsHistory.today');
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return this.translation.translate('symptomsHistory.yesterday');
    }
    return date.toLocaleDateString(this.dateLocale(), { weekday: 'long' });
  }

  goBack() {
    this.router.navigate(['tabs/home']);
  }

  viewDayDetails(date: string) {
    this.router.navigate(['/symptoms-detail'], {
      queryParams: { date: date }
    });
  }

  trackNewSymptoms() {
    this.router.navigate(['/symptoms-tracker']);
  }
}
