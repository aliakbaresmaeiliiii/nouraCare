import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';



export interface PeriodDateRange {
  startDate: Date;
  periodDates: Date[];
  isPastDate: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-period-date-picker-page',
  templateUrl: './period-date-picker-page.component.html',
  styleUrls: ['./period-date-picker-page.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PeriodDatePickerPageComponent implements OnInit {
  selectedDate: string = new Date().toISOString().split('T')[0];
  periodLength: number = 5;
  highlightedDates: any[] = [];

  constructor(private modalController: ModalController) { }

  ngOnInit() {
    this.updateHighlightedDates();
  }

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
    this.updateHighlightedDates();
  }

  updateHighlightedDates() {
    if (!this.selectedDate) return;

    const startDate = new Date(this.selectedDate);
    const dates = [];

    // Add the start date
    dates.push({
      date: this.selectedDate,
      textColor: '#ffffff',
      backgroundColor: '#ec4899'
    });

    // Add the next 4 days (period range)
    for (let i = 1; i < this.periodLength; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isPast = date < new Date();
      const isToday = date.toDateString() === new Date().toDateString();

      let backgroundColor = '#10b981'; // Future period - green
      let textColor = '#ffffff';

      if (isPast) {
        backgroundColor = '#ef4444'; // Past period - red
      } else if (isToday) {
        backgroundColor = '#f59e0b'; // Today - orange
      }

      dates.push({
        date: date.toISOString().split('T')[0],
        textColor: textColor,
        backgroundColor: backgroundColor
      });
    }

    this.highlightedDates = dates;
  }

  savePeriod() {
    const startDate = new Date(this.selectedDate);
    const periodDates = [];

    for (let i = 0; i < this.periodLength; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      periodDates.push(date);
    }

    const periodRange: PeriodDateRange = {
      startDate: startDate,
      periodDates: periodDates,
      isPastDate: startDate < new Date(),
      isToday: startDate.toDateString() === new Date().toDateString()
    };

    this.modalController.dismiss(periodRange);
  }

  cancel() {
    this.modalController.dismiss();
  }

  getDateNumber(dateString: string): number {
    return new Date(dateString).getDate();
  }
}
