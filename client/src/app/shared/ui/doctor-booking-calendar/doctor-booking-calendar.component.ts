import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { DoctorBookingTimeSlot } from '@app/shared/models/doctor-booking.model';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import {
  addBookingMonths,
  bookingIsoDateKey,
  buildCalendarMonthDays,
  formatBookingDayNumber,
  formatBookingMonthYear,
  formatBookingTime,
  formatBookingWeekday,
  isSameBookingDay,
  startOfBookingMonth,
} from '@app/shared/utils/doctor-booking-format.util';
import {
  countAvailableSlotsForDate,
  groupSlotsByDate,
  hasSlotsForDate,
  bookingScheduleMonthRange,
  isBookingMonthBefore,
} from '@app/shared/utils/doctor-booking-schedule.util';
import { getCalendarWeekdayLabels, formatLocalizedNumber } from '@app/shared/utils/locale-date-format.util';

@Component({
  selector: 'app-doctor-booking-calendar',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './doctor-booking-calendar.component.html',
  styleUrls: ['./doctor-booking-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorBookingCalendarComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) slots: DoctorBookingTimeSlot[] = [];
  @Input() loading = false;
  @Input() selectedDateIso: string | null = null;
  @Input() selectedSlotId: string | null = null;

  @Output() readonly dateSelected = new EventEmitter<string>();
  @Output() readonly slotSelected = new EventEmitter<DoctorBookingTimeSlot>();

  currentMonth = startOfBookingMonth(new Date());
  weekdayLabels: string[] = [];
  calendarDays: Date[] = [];
  daySlots: DoctorBookingTimeSlot[] = [];
  private slotsByDate = new Map<string, DoctorBookingTimeSlot[]>();
  private scheduleMonthRange: { min: Date; max: Date } | null = null;

  private readonly languageService = inject(LanguageService);
  private readonly translation = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshCalendar();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slots'] || changes['selectedDateIso']) {
      this.slotsByDate = groupSlotsByDate(this.slots);
      this.scheduleMonthRange = bookingScheduleMonthRange(this.slots);
      this.refreshView();
      this.cdr.markForCheck();
    } else if (changes['selectedSlotId']) {
      this.refreshDaySlots();
      this.cdr.markForCheck();
    }
  }

  get monthTitle(): string {
    return formatBookingMonthYear(
      this.currentMonth,
      this.languageService.getCurrentLanguage(),
    );
  }

  get hasDaySlots(): boolean {
    return this.daySlots.length > 0;
  }

  get selectedDateLabel(): string {
    if (!this.selectedDateIso) {
      return '';
    }
    const sample = this.slotsByDate.get(this.selectedDateIso)?.[0]?.scheduledAt;
    if (!sample) {
      return '';
    }
    const lang = this.languageService.getCurrentLanguage();
    const weekday = formatBookingWeekday(sample, lang);
    const dayNum = formatBookingDayNumber(sample, lang);
    return `${weekday} ${dayNum}`;
  }

  t(key: string): string {
    return this.translation.translate(key);
  }

  get canGoPreviousMonth(): boolean {
    if (!this.scheduleMonthRange) {
      return false;
    }
    return isBookingMonthBefore(
      this.scheduleMonthRange.min,
      this.currentMonth,
    );
  }

  get canGoNextMonth(): boolean {
    if (!this.scheduleMonthRange) {
      return false;
    }
    return isBookingMonthBefore(
      this.currentMonth,
      this.scheduleMonthRange.max,
    );
  }

  previousMonth(): void {
    if (!this.canGoPreviousMonth) {
      return;
    }
    this.currentMonth = addBookingMonths(this.currentMonth, -1);
    this.refreshCalendar();
    this.cdr.markForCheck();
  }

  nextMonth(): void {
    if (!this.canGoNextMonth) {
      return;
    }
    this.currentMonth = addBookingMonths(this.currentMonth, 1);
    this.refreshCalendar();
    this.cdr.markForCheck();
  }

  selectDate(day: Date): void {
    if (!this.canSelectDate(day)) {
      return;
    }
    this.dateSelected.emit(bookingIsoDateKey(day));
  }

  selectSlot(slot: DoctorBookingTimeSlot): void {
    if (!slot.available) {
      return;
    }
    this.slotSelected.emit(slot);
  }

  isCurrentMonth(day: Date): boolean {
    return (
      day.getMonth() === this.currentMonth.getMonth() &&
      day.getFullYear() === this.currentMonth.getFullYear()
    );
  }

  isToday(day: Date): boolean {
    return isSameBookingDay(day, new Date());
  }

  isSelectedDate(day: Date): boolean {
    return this.selectedDateIso === bookingIsoDateKey(day);
  }

  canSelectDate(day: Date): boolean {
    if (!this.isCurrentMonth(day)) {
      return false;
    }
    return hasSlotsForDate(this.slots, bookingIsoDateKey(day));
  }

  hasAvailability(day: Date): boolean {
    return countAvailableSlotsForDate(this.slots, bookingIsoDateKey(day)) > 0;
  }

  isFullyBooked(day: Date): boolean {
    const key = bookingIsoDateKey(day);
    const dayItems = this.slotsByDate.get(key) ?? [];
    return dayItems.length > 0 && dayItems.every((slot) => !slot.available);
  }

  dayNumber(day: Date): string {
    return formatLocalizedNumber(
      day.getDate(),
      this.languageService.getCurrentLanguage(),
    );
  }

  slotTimeLabel(slot: DoctorBookingTimeSlot): string {
    if (!slot.scheduledAt) {
      return '';
    }
    return formatBookingTime(
      slot.scheduledAt,
      this.languageService.getCurrentLanguage(),
    );
  }

  isSlotActive(slot: DoctorBookingTimeSlot): boolean {
    return this.selectedSlotId === slot.id;
  }

  private refreshView(): void {
    if (this.selectedDateIso) {
      const anchor = new Date(`${this.selectedDateIso}T12:00:00`);
      this.currentMonth = startOfBookingMonth(anchor);
    } else if (this.scheduleMonthRange) {
      this.currentMonth = new Date(this.scheduleMonthRange.min);
    }

    if (this.scheduleMonthRange) {
      if (
        isBookingMonthBefore(this.currentMonth, this.scheduleMonthRange.min)
      ) {
        this.currentMonth = new Date(this.scheduleMonthRange.min);
      } else if (
        isBookingMonthBefore(this.scheduleMonthRange.max, this.currentMonth)
      ) {
        this.currentMonth = new Date(this.scheduleMonthRange.max);
      }
    }

    this.refreshCalendar();
    this.refreshDaySlots();
  }

  private refreshCalendar(): void {
    const lang = this.languageService.getCurrentLanguage();
    this.weekdayLabels = getCalendarWeekdayLabels(lang);
    this.calendarDays = buildCalendarMonthDays(this.currentMonth, lang);
  }

  private refreshDaySlots(): void {
    if (!this.selectedDateIso) {
      this.daySlots = [];
      return;
    }
    this.daySlots = [...(this.slotsByDate.get(this.selectedDateIso) ?? [])];
  }
}
