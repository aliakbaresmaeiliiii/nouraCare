import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { LanguageService } from '../../services/language.service';
import {
  addDays,
  addMonths,
  jalaliDayOfMonth,
  jalaliYearMonthKey,
  saturdayFirstWeekPadding,
  startOfMonth,
} from '../../utils/jalali-iranian-calendar.util';
import {
  formatMonthYearTitle,
  getCalendarWeekdayLabels,
} from '../../utils/locale-date-format.util';
import { PeriodHistoryService } from '../../services/period-history.service';
import { LocalizedNumberPipe } from '../../pipes/localized-number.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface PeriodDateRange {
  startDate: Date;
  periodDates: Date[];
  isPastDate: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-period-date-picker',
  templateUrl: './period-date-picker.component.html',
  styleUrls: ['./period-date-picker.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, LocalizedNumberPipe, TranslatePipe],
})
export class PeriodDatePickerComponent implements OnInit, OnChanges {
  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }

  private languageService = inject(LanguageService);
  periodLogService = inject(PeriodHistoryService)
  private appLang = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  @Input() periodLength: number = 5;
  @Input() cycleLength: number = 28;
  @Input() locale: string = 'en-US';
  /** Pre-select first day of last period (YYYY-MM-DD) */
  @Input() initialStartIso: string | null = null;
  @Output() dateSelected = new EventEmitter<PeriodDateRange>();

  currentDate = signal(new Date());
  selectedStartDate = signal<Date | null>(null);
  currentMonth = signal(new Date());
  activeLegend = signal<'start' | 'period' | 'today' | null>(null);

  calendarDays = computed(() => {
    this.appLang();
    return this.generateCalendarDays();
  });
  monthYearTitle = computed(() => {
    this.appLang();
    const cm = this.currentMonth();
    if (this.languageService.getCurrentLanguage() === 'fa') {
      return formatMonthYearTitle(startOfMonth(cm), 'fa');
    }
    return cm.toLocaleDateString(this.locale, {
      month: 'long',
      year: 'numeric',
    });
  });
  weekDays = computed(() => {
    this.appLang();
    if (this.languageService.getCurrentLanguage() === 'fa') {
      return getCalendarWeekdayLabels('fa');
    }
    return this.getWeekDaysGregorian();
  });

  ngOnInit() {
    const now = new Date();
    if (this.languageService.getCurrentLanguage() === 'fa') {
      this.currentMonth.set(startOfMonth(now));
    } else {
      this.currentMonth.set(new Date(now.getFullYear(), now.getMonth(), 1));
    }
    this.applyInitialFromInput();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialStartIso']) {
      this.applyInitialFromInput();
    }
    if (changes['periodLength'] && !changes['periodLength'].firstChange) {
      this.emitIfSelection();
    }
  }

  private applyInitialFromInput() {
    const raw = this.initialStartIso;
    if (!raw) return;
    const part = raw.split('T')[0];
    const [y, m, d] = part.split('-').map((n) => parseInt(n, 10));
    if (!y || !m || !d) return;
    const start = new Date(y, m - 1, d);
    this.selectedStartDate.set(start);
    if (this.languageService.getCurrentLanguage() === 'fa') {
      this.currentMonth.set(startOfMonth(start));
    } else {
      this.currentMonth.set(new Date(y, m - 1, 1));
    }
    this.emitIfSelection();
  }

  private emitIfSelection() {
    const d = this.selectedStartDate();
    if (!d) return;
    this.emitRange(d);
  }

  private emitRange(start: Date) {
    const periodRange: PeriodDateRange = {
      startDate: new Date(start),
      periodDates: this.buildPeriodDates(start),
      isPastDate: this.isPastDate(start),
      isToday: this.isToday(start),
    };
    this.dateSelected.emit(periodRange);
  }

  generateCalendarDays(): Date[] {
    if (this.languageService.getCurrentLanguage() === 'fa') {
      const first = startOfMonth(this.currentMonth());
      const pad = saturdayFirstWeekPadding(first);
      const gridStart = addDays(first, -pad);
      const days: Date[] = [];
      for (let i = 0; i < 42; i++) {
        days.push(addDays(gridStart, i));
      }
      return days;
    }

    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  }

  private getWeekDaysGregorian(): string[] {
    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, i + 1);
      weekDays.push(
        date.toLocaleDateString(this.locale, { weekday: 'short' }),
      );
    }
    return weekDays;
  }

  displayDayNum(date: Date): number {
    if (this.languageService.getCurrentLanguage() === 'fa') {
      return jalaliDayOfMonth(date);
    }
    return date.getDate();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    if (this.languageService.getCurrentLanguage() === 'fa') {
      return (
        jalaliYearMonthKey(date) ===
        jalaliYearMonthKey(startOfMonth(this.currentMonth()))
      );
    }
    return (
      date.getMonth() === this.currentMonth().getMonth() &&
      date.getFullYear() === this.currentMonth().getFullYear()
    );
  }

  isSelectedStartDate(date: Date): boolean {
    const selectedDate = this.selectedStartDate();
    return (
      selectedDate !== null &&
      date.toDateString() === selectedDate.toDateString()
    );
  }

  isInPeriodRange(date: Date): boolean {
    const selectedDate = this.selectedStartDate();
    if (!selectedDate) return false;

    const startDate = new Date(selectedDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + this.periodLength - 1);

    const t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const a = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const b = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );
    return t >= a && t <= b;
  }

  isInCycleRange(date: Date): boolean {
    const selectedDate = this.selectedStartDate();
    if (!selectedDate) return false;

    const safeCycleLength = Math.max(21, Math.min(60, this.cycleLength || 28));
    const startDate = new Date(selectedDate);
    const cycleEndDate = new Date(startDate);
    cycleEndDate.setDate(startDate.getDate() + safeCycleLength - 1);

    const t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const a = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const b = new Date(
      cycleEndDate.getFullYear(),
      cycleEndDate.getMonth(),
      cycleEndDate.getDate(),
    );
    return t >= a && t <= b;
  }

  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return x < today;
  }

  private buildPeriodDates(start: Date): Date[] {
    const dates: Date[] = [];
    const base = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    for (let i = 0; i < this.periodLength; i++) {
      const date = new Date(base);
      date.setDate(base.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  onDateSelect(date: Date) {
    if (!this.isCurrentMonth(date)) return;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    this.selectedStartDate.set(d);
    this.activeLegend.set('start');
    this.emitRange(d);
  }

  focusLegend(type: 'start' | 'period' | 'today') {
    this.activeLegend.set(type);
    if (type === 'today') {
      const today = new Date();
      if (this.languageService.getCurrentLanguage() === 'fa') {
        this.currentMonth.set(startOfMonth(today));
      } else {
        this.currentMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
      }
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      this.selectedStartDate.set(d);
      this.emitRange(d);
    }
  }

  isLegendActive(type: 'start' | 'period' | 'today'): boolean {
    return this.activeLegend() === type;
  }

  previousMonth() {
    if (this.languageService.getCurrentLanguage() === 'fa') {
      const first = startOfMonth(this.currentMonth());
      this.currentMonth.set(addMonths(first, -1));
    } else {
      const newMonth = new Date(this.currentMonth());
      newMonth.setMonth(newMonth.getMonth() - 1);
      this.currentMonth.set(newMonth);
    }
  }

  nextMonth() {
    if (this.languageService.getCurrentLanguage() === 'fa') {
      const first = startOfMonth(this.currentMonth());
      this.currentMonth.set(addMonths(first, 1));
    } else {
      const newMonth = new Date(this.currentMonth());
      newMonth.setMonth(newMonth.getMonth() + 1);
      this.currentMonth.set(newMonth);
    }
  }
}
