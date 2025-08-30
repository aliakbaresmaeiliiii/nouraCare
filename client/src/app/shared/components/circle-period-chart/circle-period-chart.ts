import { Component, effect, inject, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonDatetime } from '@ionic/angular';
import { SharedModule } from '../../shared-module';
import { CycleSettingsService } from 'src/app/shared/services/cycle-settings.service';

export interface Segment {
  label: string; // نام بخش، مثلا "پریود"
  days: number; // تعداد روزها
  color: string; // رنگ بخش
}

@Component({
  selector: 'app-circle-period-chart',
  imports: [SharedModule],
  templateUrl: './circle-period-chart.html',
  styleUrl: './circle-period-chart.scss',
})
export class CirclePeriodChart {
  @ViewChild('periodCalendar') periodCalendar!: IonDatetime;
  router = inject(Router);
  private cycleSettings = inject(CycleSettingsService);
  // Configuration inputs
  @Input() cycleLength: number = 28; // total cycle length in days
  @Input() periodLength: number = 5; // menstruation length in days

  // Computed state
  @Input() ovulationDay: number = 14; // computed from cycleLength in ngOnInit
  segments: { start: number; len: number; color: string }[] = [];

  // User selections
  startDate: string | null = null; // last period start (YYYY-MM-DD)
  endDate: string | null = null; // last period end (YYYY-MM-DD)

  // Today
  todayDate: Date = new Date();
  todayCycleDay: number = 0; // 0-based index in current cycle relative to startDate
  radius = 152;
  circumference = 2 * Math.PI * this.radius;

  todayX = 0;
  todayY = 0;
  ovulationX = 0;
  ovulationY = 0;
  ovulationRotation = 0;
  // labels around ring
  periodLabelX = 0;
  periodLabelY = 0;
  cycleLabelX = 0;
  cycleLabelY = 0;
  totalDays = this.cycleLength;
  highlightedPeriods = 4;
  R = 152;

  // Phase lengths (in days)
  fertileWindowLength = 6;
  pmsLength = 5;
  ovulationLengthDays = 1;

  showPeriodSheet = false;

  years = Array.from({ length: 30 }, (_, i) => 2000 + i);
  months = Array.from({ length: 12 }, (_, i) => i + 1);
  pickerDays = Array.from({ length: 31 }, (_, i) => i + 1);
  ringDays = Array.from({ length: this.cycleLength }, (_, i) => i + 1);

  // شروع
  startYear = new Date().getFullYear();
  startMonth = new Date().getMonth() + 1;
  startDay = new Date().getDate();

  // پایان
  endYear = new Date().getFullYear();
  endMonth = new Date().getMonth() + 1;
  endDay = new Date().getDate();
  periodCount = 6;
  periodDays = 0;
  tempYear = new Date().getFullYear();
  tempMonth = new Date().getMonth() + 1;
  tempDay = new Date().getDate();
  pickerType: 'start' | 'end' = 'start';
  showPicker = false;

  openPicker(type: 'start' | 'end') {
    this.pickerType = type;
    this.showPicker = true;

    const baseDate = type === 'start' ? this.startDate : this.endDate;
    const dateObj = baseDate ? new Date(baseDate) : new Date();
    this.tempYear = dateObj.getFullYear();
    this.tempMonth = dateObj.getMonth() + 1;
    this.tempDay = dateObj.getDate();
  }
  onStartChange(ev: any, type: 'year' | 'month' | 'day') {
    if (type === 'year') this.startYear = +ev.detail.value;
    if (type === 'month') this.startMonth = +ev.detail.value;
    if (type === 'day') this.startDay = +ev.detail.value;
    this.calculatePeriodDays();
  }

  onEndChange(ev: any, type: 'year' | 'month' | 'day') {
    if (type === 'year') this.endYear = +ev.detail.value;
    if (type === 'month') this.endMonth = +ev.detail.value;
    if (type === 'day') this.endDay = +ev.detail.value;
    this.calculatePeriodDays();
  }

  calculatePeriodDays() {
    if (!this.startDate || !this.endDate) {
      this.periodDays = 0;
      return;
    }
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diff =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    this.periodDays = diff > 0 ? diff : 0;
  }

  closePeriodSheet() {
    this.showPeriodSheet = false;
  }

  ngOnChanges(): void {
    this.recomputeEverything();
  }

  ngOnInit() {
    // initialize from shared settings, stay reactive
    this.cycleLength = this.cycleSettings.cycleLength();
    this.periodLength = this.cycleSettings.periodLength();
    const lp = this.cycleSettings.lastPeriodStartDate();
    if (lp) this.startDate = lp;
    this.recomputeEverything();
  }

  // watch for changes (must be in injection context; field initializers are OK)
  private watchCycleLength = effect(() => {
    const v = this.cycleSettings.cycleLength();
    this.onCycleLengthChange(v as number);
  });

  private watchPeriodLength = effect(() => {
    const v = this.cycleSettings.periodLength();
    this.onPeriodLengthChange(v as number);
  });

  private watchLastPeriodStart = effect(() => {
    const v = this.cycleSettings.lastPeriodStartDate();
    this.startDate = (v as string) || null;
    if (this.startDate) {
      this.endDate = this.addDaysToIso(this.startDate, this.periodLength - 1);
    }
    this.recomputeEverything();
  });

  dashArray(len: number): string {
    // len is in "days" relative to cycleLength
    return `${(len / this.cycleLength) * this.circumference} ${
      this.circumference
    }`;
  }

  dashOffset(start: number): string {
    // start is in "days" relative to cycleLength
    return `${(start / this.cycleLength) * this.circumference}`;
  }
  getDayX(index: number, total: number) {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return this.R * Math.cos(angle);
  }

  getDayY(index: number, total: number) {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return this.R * Math.sin(angle);
  }

  isToday(value: number): boolean {
    // value is 1..cycleLength label on ring
    return value - 1 === this.todayCycleDay;
  }

  private updatePositions() {
    // today dot (use todayCycleDay)
    const todayAngle =
      ((this.todayCycleDay + 1) / this.cycleLength) * 2 * Math.PI - Math.PI / 2;
    this.todayX = 132 * Math.cos(todayAngle);
    this.todayY = 132 * Math.sin(todayAngle);

    // ovulation heart at ovulationDay (0-based index)
    const ovAngle =
      ((this.ovulationDay + 1) / this.cycleLength) * 2 * Math.PI - Math.PI / 2;
    this.ovulationX = 120 * Math.cos(ovAngle);
    this.ovulationY = 120 * Math.sin(ovAngle);
    this.ovulationRotation = (ovAngle * 180) / Math.PI + 90;

    // period label at middle of period arc, slightly outside ring
    const periodMidAngle =
      (((0 + this.periodLength / 2) / this.cycleLength) * 2 * Math.PI) -
      Math.PI / 2;
    const periodLabelRadius = this.radius + 30;
    this.periodLabelX = periodLabelRadius * Math.cos(periodMidAngle);
    this.periodLabelY = periodLabelRadius * Math.sin(periodMidAngle);

    // cycle label at top outside ring
    const cycleAngleTop = -Math.PI / 2;
    const cycleLabelRadius = this.radius + 46;
    this.cycleLabelX = cycleLabelRadius * Math.cos(cycleAngleTop);
    this.cycleLabelY = cycleLabelRadius * Math.sin(cycleAngleTop);
  }

  selectedStartDate: any;
  selectedEndDate: any;
  showCalendar = false;

  editPeriod(event: Event) {
    console.log('Edit period clicked!', event);
    // update signals if you like
    // this.fertilityStatus.set('Updated!');
    // this.strokes.set('90, 100');
  }

  openCalendar() {
    this.showCalendar = true;
  }

  dateChanged(event: any) {
    const picked = new Date(event.detail.value);
    this.selectedStartDate = picked.toISOString();
    this.selectedEndDate = picked.toISOString();
    // this.updateSegmentsFromDate(picked);
  }

  updateSegmentsFromDate(startDate: any, endDate: any) {
    if (!startDate || !endDate) {
      this.segments = [];
      return;
    }
    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Calculate actual period length from selection (fallback to configured periodLength)
    const actualPeriodLength =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    this.periodLength = isFinite(actualPeriodLength) && actualPeriodLength > 0
      ? actualPeriodLength
      : this.periodLength;

    this.recomputeEverything();
    this.closePeriodSheet();
  }

  activePicker: 'start' | 'end' | null = null;

  onChange(ev: any, type: 'year' | 'month' | 'day') {
    const value = ev.detail.value;
    if (type === 'year') this.tempYear = +ev.detail.value;
    if (type === 'month') this.tempMonth = +ev.detail.value;
    if (type === 'day') this.tempDay = +ev.detail.value;
  }

  closePicker() {
    this.showPicker = false;
  }

  confirmPicker() {
    const formattedDate = `${this.tempYear}-${String(this.tempMonth).padStart(
      2,
      '0'
    )}-${String(this.tempDay).padStart(2, '0')}`;

    if (this.pickerType === 'start') {
      this.startDate = formattedDate;
      // auto-calc end date from periodLength when set
      this.endDate = this.addDaysToIso(this.startDate, this.periodLength - 1);
    } else {
      this.endDate = formattedDate;
    }
    if (this.startDate && this.endDate) {
      this.calculatePeriodDays();
      this.updateSegmentsFromDate(this.startDate, this.endDate);
    }
    this.showPicker = false;
  }

  goToToday() {
    const today = new Date();
    this.selectedStartDate = today.toISOString();
    this.selectedEndDate = today.toISOString();
  }

  closeCalendar() {
    this.showCalendar = false;
  }

  editCycle() {
    this.showCalendar = true;
    console.log('Edit cycle clicked!');
    // this.router.navigate(['cycle-edit']);
  }

  openButtonSheet() {
    this.showPicker = true;
  }

  savePeriod() {
    if (this.startDate && this.endDate) {
      this.updateSegmentsFromDate(this.startDate, this.endDate);
    }
  }

  // --- helpers & recompute ---
  private addDaysToIso(isoDate: string, daysToAdd: number): string {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + daysToAdd);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private formatDateShort(d: Date): string {
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
    });
  }

  get periodStartLabel(): string {
    if (!this.startDate) return '-';
    const d = new Date(this.startDate);
    return this.formatDateShort(d);
  }

  get fertilityStartLabel(): string {
    if (!this.startDate) return '-';
    const fertileStart = this.ovulationDay - 5;
    const d = new Date(this.addDaysToIso(this.startDate, fertileStart));
    return this.formatDateShort(d);
  }

  get ovulationLabel(): string {
    if (!this.startDate) return '-';
    const d = new Date(this.addDaysToIso(this.startDate, this.ovulationDay));
    return this.formatDateShort(d);
  }

  get pmsStartLabel(): string {
    if (!this.startDate) return '-';
    const pmsStart = this.cycleLength - 5;
    const d = new Date(this.addDaysToIso(this.startDate, pmsStart));
    return this.formatDateShort(d);
  }

  onCycleLengthChange(ev: any) {
    const value = Number(ev?.detail?.value ?? ev);
    this.cycleLength = Math.max(21, Math.min(60, Math.floor(value || 28)));
    this.ringDays = Array.from({ length: this.cycleLength }, (_, i) => i + 1);
    this.recomputeEverything();
  }

  onPeriodLengthChange(ev: any) {
    const value = Number(ev?.detail?.value ?? ev);
    this.periodLength = Math.max(1, Math.min(10, Math.floor(value || 5)));
    if (this.startDate) {
      this.endDate = this.addDaysToIso(this.startDate, this.periodLength - 1);
      this.calculatePeriodDays();
    }
    this.recomputeEverything();
  }

  private addSegmentWithWrap(start: number, len: number, color: string) {
    // normalize start
    let s = ((start % this.cycleLength) + this.cycleLength) % this.cycleLength;
    if (len <= 0) return;
    if (s + len <= this.cycleLength) {
      this.segments.push({ start: s, len, color });
    } else {
      const firstPart = this.cycleLength - s;
      const secondPart = len - firstPart;
      this.segments.push({ start: s, len: firstPart, color });
      this.segments.push({ start: 0, len: secondPart, color });
    }
  }

  private recomputeEverything() {
    // ovulation assumed luteal phase ~14 days -> index = cycleLength - 15 (0-based)
    this.ovulationDay = Math.max(0, this.cycleLength - 15);

    // refresh ring day labels
    this.ringDays = Array.from({ length: this.cycleLength }, (_, i) => i + 1);

    // compute today cycle day relative to last period start
    if (this.startDate) {
      const start = new Date(this.startDate);
      const diffDays = Math.floor(
        (this.todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      const mod = ((diffDays % this.cycleLength) + this.cycleLength) % this.cycleLength;
      this.todayCycleDay = mod;
    } else {
      // fallback: keep current day index within cycle length (not ideal but avoids NaN)
      const todayNum = new Date().getDate();
      this.todayCycleDay = ((todayNum - 1) % this.cycleLength + this.cycleLength) % this.cycleLength;
    }

    // rebuild segments
    this.segments = [];
    // Period segment starts at day 0 (cycle start) for periodLength days
    this.addSegmentWithWrap(0, this.periodLength, '#A01D1E');

    // Fertile window: ovulationDay - 5 to ovulationDay + 1 (6 days)
    const fertileStart = this.ovulationDay - 5;
    this.addSegmentWithWrap(fertileStart, this.fertileWindowLength, '#4DE2EF');

    // Ovulation marker: very short segment at ovulationDay
    this.addSegmentWithWrap(this.ovulationDay, 0.6, '#0FA3B1');

    // PMS: last pmsLength days before next period
    this.addSegmentWithWrap(this.cycleLength - this.pmsLength, this.pmsLength, '#463BAC');

    // positions for today & ovulation
    this.updatePositions();
  }
}
