import { Component, EventEmitter, Input, Output, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

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
  imports: [CommonModule, IonicModule]
})
export class PeriodDatePickerComponent implements OnInit {
  @Input() periodLength: number = 5;
  @Input() locale: string = 'en-US';
  @Output() dateSelected = new EventEmitter<PeriodDateRange>();

  // Signals for reactive state management
  currentDate = signal(new Date());
  selectedStartDate = signal<Date | null>(null);
  currentMonth = signal(new Date());

  // Computed values
  calendarDays = computed(() => this.generateCalendarDays());
  monthName = computed(() => this.getMonthName());
  yearName = computed(() => this.getYearName());
  weekDays = computed(() => this.getWeekDays());

  constructor() {}

  ngOnInit() {
    // Initialize with current month
    this.currentMonth.set(new Date());
  }

  // Generate calendar days for the current month
  generateCalendarDays(): Date[] {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const currentDate = new Date();

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  }

  // Get month name
  getMonthName(): string {
    return this.currentMonth().toLocaleDateString(this.locale, { month: 'long' });
  }

  // Get year
  getYearName(): string {
    return this.currentMonth().getFullYear().toString();
  }

  // Get week days
  getWeekDays(): string[] {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, i + 1); // Use a known Sunday
      weekDays.push(date.toLocaleDateString(this.locale, { weekday: 'short' }));
    }
    return weekDays;
  }

  // Check if date is today
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Check if date is in current month
  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth().getMonth();
  }

  // Check if date is selected as start date
  isSelectedStartDate(date: Date): boolean {
    const selectedDate = this.selectedStartDate();
    return selectedDate !== null && 
           date.toDateString() === selectedDate.toDateString();
  }

  // Check if date is in period range
  isInPeriodRange(date: Date): boolean {
    const selectedDate = this.selectedStartDate();
    if (!selectedDate) return false;
    
    const startDate = new Date(selectedDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + this.periodLength - 1);
    
    return date >= startDate && date <= endDate;
  }

  // Check if selected date is in the past
  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  // Check if selected date is today
  isSelectedToday(date: Date): boolean {
    return this.isToday(date) && this.isSelectedStartDate(date);
  }

  // Get period dates array
  getPeriodDates(): Date[] {
    if (!this.selectedStartDate()) return [];
    
    const dates: Date[] = [];
    const startDate = new Date(this.selectedStartDate()!);
    
    for (let i = 0; i < this.periodLength; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }

  // Handle date selection
  onDateSelect(date: Date) {
    this.selectedStartDate.set(date);
    
    const periodRange: PeriodDateRange = {
      startDate: new Date(date),
      periodDates: this.getPeriodDates(),
      isPastDate: this.isPastDate(date),
      isToday: this.isToday(date)
    };
    
    this.dateSelected.emit(periodRange);
  }

  // Navigate to previous month
  previousMonth() {
    const newMonth = new Date(this.currentMonth());
    newMonth.setMonth(newMonth.getMonth() - 1);
    this.currentMonth.set(newMonth);
  }

  // Navigate to next month
  nextMonth() {
    const newMonth = new Date(this.currentMonth());
    newMonth.setMonth(newMonth.getMonth() + 1);
    this.currentMonth.set(newMonth);
  }

  // Get CSS classes for date styling
  getDateClasses(date: Date): string {
    let classes = 'calendar-day';
    
    if (!this.isCurrentMonth(date)) {
      classes += ' other-month';
    }
    
    if (this.isToday(date)) {
      classes += ' today';
    }
    
    if (this.isSelectedStartDate(date)) {
      classes += ' selected-start';
    }
    
    if (this.isInPeriodRange(date) && !this.isSelectedStartDate(date)) {
      const selectedDate = this.selectedStartDate();
      if (selectedDate && this.isPastDate(selectedDate)) {
        classes += ' period-past';
      } else if (selectedDate && this.isSelectedToday(selectedDate)) {
        classes += ' period-upcoming';
      } else {
        classes += ' period-future';
      }
    }
    
    return classes;
  }

  // Get period indicator class
  getPeriodIndicatorClass(date: Date): string {
    if (this.isSelectedStartDate(date)) {
      if (this.isPastDate(date)) {
        return 'period-indicator past-start';
      } else if (this.isToday(date)) {
        return 'period-indicator today-start';
      } else {
        return 'period-indicator future-start';
      }
    }
    
    if (this.isInPeriodRange(date) && !this.isSelectedStartDate(date)) {
      const selectedDate = this.selectedStartDate();
      if (selectedDate && this.isPastDate(selectedDate)) {
        return 'period-indicator past-period';
      } else if (selectedDate && this.isSelectedToday(selectedDate)) {
        return 'period-indicator upcoming-period';
      } else {
        return 'period-indicator future-period';
      }
    }
    
    return '';
  }
}
