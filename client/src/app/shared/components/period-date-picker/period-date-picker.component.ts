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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

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
  imports: [CommonModule, IonicModule],
})
export class PeriodDatePickerComponent implements OnInit, OnChanges {
  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }

  @Input() periodLength: number = 5;
  @Input() locale: string = 'en-US';
  /** Pre-select first day of last period (YYYY-MM-DD) */
  @Input() initialStartIso: string | null = null;
  @Output() dateSelected = new EventEmitter<PeriodDateRange>();

  currentDate = signal(new Date());
  selectedStartDate = signal<Date | null>(null);
  currentMonth = signal(new Date());

  calendarDays = computed(() => this.generateCalendarDays());
  monthYearTitle = computed(() =>
    this.currentMonth().toLocaleDateString(this.locale, {
      month: 'long',
      year: 'numeric',
    }),
  );
  weekDays = computed(() => this.getWeekDays());

  ngOnInit() {
    this.currentMonth.set(new Date());
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
    this.currentMonth.set(new Date(y, m - 1, 1));
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

  getWeekDays(): string[] {
    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, i + 1);
      weekDays.push(
        date.toLocaleDateString(this.locale, { weekday: 'short' }),
      );
    }
    return weekDays;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth().getMonth();
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
    this.emitRange(d);
  }

  previousMonth() {
    const newMonth = new Date(this.currentMonth());
    newMonth.setMonth(newMonth.getMonth() - 1);
    this.currentMonth.set(newMonth);
  }

  nextMonth() {
    const newMonth = new Date(this.currentMonth());
    newMonth.setMonth(newMonth.getMonth() + 1);
    this.currentMonth.set(newMonth);
  }
}
