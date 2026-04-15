import { Component, inject, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { ModalController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import {
  ReproductiveStatusService,
  ReproductiveStatusData,
} from '../shared/services/reproductive-status.service';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import {
  PeriodHistoryService,
  PeriodHistoryEntry,
} from '../shared/services/period-history.service';
import { Router } from '@angular/router';
import { HomeDataService } from '../home/services/home-data.service';
import { PeriodDatePickerPageComponent } from '../period-date-picker-page/period-date-picker-page.component';
import { PeriodDateRange } from '../shared/components/period-date-picker/period-date-picker.component';

export type CycleDayKind =
  | 'empty'
  | 'muted'
  | 'today'
  | 'period'
  | 'fertile'
  | 'ovulation';

export interface CalendarCell {
  date: Date | null;
  dayNum: number | null;
  kind: CycleDayKind;
  /** Stable key for @for track */
  key: string;
}

@Component({
  selector: 'app-cycle-calendar',
  templateUrl: './cycle-calendar.component.html',
  styleUrls: ['./cycle-calendar.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class CycleCalendarComponent implements OnInit {
  constructor() {
    addIcons({
      addCircleOutline,
      calendarOutline,
      chevronBackOutline,
      chevronForwardOutline,
    });
  }

  private reproductiveStatusService = inject(ReproductiveStatusService);
  private cycleSettings = inject(CycleSettingsService);
  private periodHistory = inject(PeriodHistoryService);
  private modalController = inject(ModalController);
  private router = inject(Router);
  homeService = inject(HomeDataService);

  reproductiveStatus: ReproductiveStatusData = {};
  viewDate = new Date();
  monthTitle = '';
  calendarWeeks: CalendarCell[][] = [];
  weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  hasCycleData = false;
  historyEntries: PeriodHistoryEntry[] = [];

  ngOnInit() {
    this.refreshCalendar();
    this.refreshHistory();
    const userId = this.homeService.getCurrentUserId();
    this.loadReproductiveStatus(userId);
  }

  refreshHistory() {
    const iso = this.cycleSettings.lastPeriodStartDate();
    if (iso) {
      this.periodHistory.seedFromCurrentIfEmpty(iso);
    }
    this.historyEntries = this.periodHistory.getEntries();
  }

  loadReproductiveStatus(userId: number) {
    this.reproductiveStatusService.getReproductiveStatus(userId).subscribe({
      next: (data) => {
        this.reproductiveStatus = data;
        this.refreshCalendar();
        this.refreshHistory();
      },
      error: () => {
        this.refreshCalendar();
        this.refreshHistory();
      },
    });
  }

  async openLogPeriodModal() {
    const modal = await this.modalController.create({
      component: PeriodDatePickerPageComponent,
      componentProps: {
        initialStartIso: this.cycleSettings.lastPeriodStartDate(),
      },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      backdropDismiss: true,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.applyPeriodRange(data as PeriodDateRange);
    }
  }

  private applyPeriodRange(periodRange: PeriodDateRange) {
    const iso = periodRange.startDate.toISOString().split('T')[0];
    this.cycleSettings.setUserStatus('Trying to Conceive');
    this.cycleSettings.setPregnancyStatus(false);
    this.cycleSettings.setPostpartumStatus(false);
    this.cycleSettings.setLastPeriodStart(iso);
    this.periodHistory.addEntry(iso);
    this.refreshHistory();
    this.refreshCalendar();
    this.loadReproductiveStatus(this.homeService.getCurrentUserId());
  }

  formatHistoryDay(iso: string): string {
    const [y, m, d] = iso.split('T')[0].split('-').map((n) => parseInt(n, 10));
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatRecordedAt(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  prevMonth() {
    this.viewDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() - 1,
      1,
    );
    this.refreshCalendar();
  }

  nextMonth() {
    this.viewDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() + 1,
      1,
    );
    this.refreshCalendar();
  }

  private parseLocalDate(iso: string): Date {
    const part = iso.split('T')[0];
    const [y, m, d] = part.split('-').map((n) => parseInt(n, 10));
    return new Date(y, m - 1, d);
  }

  private getLastPeriodAnchor(): Date | null {
    const raw =
      this.reproductiveStatus.lastPeriodDate ??
      this.cycleSettings.lastPeriodStartDate();
    if (!raw) return null;
    return this.parseLocalDate(raw);
  }

  private dayDiff(a: Date, b: Date): number {
    const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((ua - ub) / 86400000);
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private classifyDay(
    date: Date,
    anchor: Date | null,
    cycleLen: number,
    periodLen: number,
    today: Date,
  ): CycleDayKind {
    const t = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (!anchor || cycleLen < 21) {
      return this.sameDay(t, today) ? 'today' : 'muted';
    }

    const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    const diff = this.dayDiff(t, a);
    const dayInCycle = ((diff % cycleLen) + cycleLen) % cycleLen;

    if (dayInCycle < periodLen) {
      return 'period';
    }

    // ~14th day of cycle (1-based) → ovulation index 13 when cycle is 28
    const ovulationIndex = Math.max(periodLen, cycleLen - 15);
    const fertileStart = Math.max(periodLen, ovulationIndex - 5);
    const fertileEnd = ovulationIndex;

    if (dayInCycle === ovulationIndex) {
      return 'ovulation';
    }
    if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) {
      return 'fertile';
    }

    return this.sameDay(t, today) ? 'today' : 'muted';
  }

  refreshCalendar() {
    const lp = this.getLastPeriodAnchor();
    const cycleLen =
      this.reproductiveStatus.cycleLength ?? this.cycleSettings.cycleLength();
    const periodLen =
      this.reproductiveStatus.averagePeriodDuration ??
      this.cycleSettings.periodLength();
    this.hasCycleData = !!lp && cycleLen >= 21;

    this.monthTitle = this.viewDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: CalendarCell[] = [];
    for (let i = 0; i < startPad; i++) {
      cells.push({
        date: null,
        dayNum: null,
        kind: 'empty',
        key: `pad-${year}-${month}-${i}`,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const kind = this.classifyDay(
        date,
        lp,
        cycleLen,
        periodLen,
        today,
      );
      cells.push({ date, dayNum: d, kind, key: `day-${year}-${month}-${d}` });
    }

    const weeks: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    if (weeks.length === 0) {
      this.calendarWeeks = [];
      return;
    }
    const lastWeek = weeks[weeks.length - 1];
    let tail = 0;
    while (lastWeek.length < 7) {
      lastWeek.push({
        date: null,
        dayNum: null,
        kind: 'empty',
        key: `tail-${year}-${month}-${tail++}`,
      });
    }
    this.calendarWeeks = weeks;
  }
}
