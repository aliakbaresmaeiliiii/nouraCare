import { Component, effect, inject, Input, ViewChild, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { IonDatetime } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';
import { CycleSettingsService } from '../../services/cycle-settings.service';
import { UserInfoService } from '../../services/user-info.service';
import { environment } from '../../../../environments/environment';

export interface Segment {
  label: string; // نام بخش، مثلا "پریود"
  days: number; // تعداد روزها
  color: string; // رنگ بخش
}

@Component({
  selector: 'app-circle-period-chart',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './circle-period-chart.html',
  styleUrl: './circle-period-chart.scss',
})
export class CirclePeriodChart implements OnInit, OnChanges {
  @ViewChild('periodCalendar') periodCalendar!: IonDatetime;
  router = inject(Router);
  private cycleSettings = inject(CycleSettingsService);
  private userInfoService = inject(UserInfoService);
  private cdr = inject(ChangeDetectorRef);
  // Configuration inputs
  @Input() cycleLength: number = 28; // total cycle length in days
  @Input() periodLength: number = 5; // menstruation length in days

  // Computed state
  @Input() ovulationDay: number = 14; // computed from cycleLength in ngOnInit
  segments: { start: number; len: number; color: string }[] = [];

  // User selections
  startDate: string | null = null; // last period start (YYYY-MM-DD)
  endDate: string | null = null; // last period end (YYYY-MM-DD)

  // Loading state
  isLoading = false;

  // Period status
  get isInPeriod(): boolean {
    return this.todayCycleDay >= 1 && this.todayCycleDay <= this.periodLength;
  }

  // Cycle phase calculations based on standard cycle science
  get fertileWindowStart(): number {
    // Fertile window typically starts 5 days before ovulation
    return Math.max(1, this.ovulationDay - 5);
  }

  get fertileWindowEnd(): number {
    // Fertile window ends 1 day after ovulation
    return Math.min(this.cycleLength, this.ovulationDay + 1);
  }

  get isInFertileWindow(): boolean {
    return this.todayCycleDay >= this.fertileWindowStart && this.todayCycleDay <= this.fertileWindowEnd;
  }

  get isOvulationDay(): boolean {
    return this.todayCycleDay === this.ovulationDay;
  }

  get pmsStart(): number {
    // PMS typically starts 5-7 days before next period
    return Math.max(1, this.cycleLength - 6);
  }

  get pmsEnd(): number {
    return this.cycleLength;
  }

  get isInPMS(): boolean {
    return this.todayCycleDay >= this.pmsStart && this.todayCycleDay <= this.pmsEnd;
  }

  // Reactive effects - must be field initializers for injection context
  private watchUserInfo = effect(() => {
    const userInfo = this.userInfoService.userInfo();
    if (userInfo) {
      this.cycleLength = userInfo.cycleLength || 28;
      this.periodLength = userInfo.periodLength || 5;
      this.startDate = userInfo.lastPeriodDate || null;
      if (this.startDate) {
        this.endDate = this.addDaysToIso(this.startDate, this.periodLength - 1);
      }
      this.recomputeEverything();
    }
  });

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

  // Today
  todayDate: Date = new Date();
  todayCycleDay: number = 0; // 1-based day number in current cycle relative to startDate
  radius = 230;
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
  R = 190;

  // Phase lengths (in days)
  fertileWindowLength = 6;
  pmsLength = 5;
  ovulationLengthDays = 1;

  showPeriodSheet = false;

  years = Array.from({ length: 30 }, (_, i) => 2000 + i);
  months = Array.from({ length: 12 }, (_, i) => i + 1);
  pickerDays = Array.from({ length: 31 }, (_, i) => i + 1);
  ringDays = Array.from({ length: this.cycleLength }, (_, i) => i + 1);
  periodDayNumbers = Array.from({ length: this.periodLength }, (_, i) => i + 1);

  // start
  startYear = new Date().getFullYear();
  startMonth = new Date().getMonth() + 1;
  startDay = new Date().getDate();

  // end
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

  ngOnChanges(changes: SimpleChanges): void {
    this.recomputeEverything();
  }

  ngOnInit() {
    // Load data from API first, then fallback to local storage
    this.loadDataFromAPI();
  }

  /**
   * Load data from API (UserInfoService) with fallback to local storage
   */
  private loadDataFromAPI() {
    
    // Always fetch fresh data from API first
    this.fetchDataFromAPI();
  }

  /**
   * Fetch fresh data from API
   */
  private fetchDataFromAPI() {
    this.isLoading = true;
    
    // Get user ID from localStorage or use default
    const userId = this.getCurrentUserId();
    
    this.userInfoService.getUserOnboardingData(userId).subscribe({
      next: (userInfo) => {
        this.cycleLength = userInfo.cycleLength || 28;
        this.periodLength = userInfo.periodLength || 5;
        this.startDate = userInfo.lastPeriodDate || null;
        this.isLoading = false;
        this.recomputeEverything();
      },
      error: (error) => {
        // Fallback to local storage
        this.cycleLength = this.cycleSettings.cycleLength();
        this.periodLength = this.cycleSettings.periodLength();
        const lp = this.cycleSettings.lastPeriodStartDate();
        this.startDate = lp || null;
        this.isLoading = false;
        this.recomputeEverything();
      }
    });
  }

  /**
   * Get current user ID from localStorage
   */
  private getCurrentUserId(): number {
    try {
      const userInfo = localStorage.getItem('userInfo');
      
      if (userInfo) {
        const parsed = JSON.parse(userInfo);  
        
        const userId = parsed.userId || parsed.id || parsed.user?.id || 1;
        return userId;
      }
    } catch (error) {
      console.error('❌ Error getting current user ID:', error);
    }
    
    return 1; // Default user ID
  }


  /**
   * Public method to manually refresh the chart
   * This can be called from parent components when data changes
   */
  public refreshChart() {
    // Always fetch fresh data from API
    this.fetchDataFromAPI();
  }

  /**
   * Debug method to check current state
   */
  public debugState() {
  }

  /**
   * Force complete reinitialization of the chart
   */
  public forceReinitialize() {
    this.ngOnInit();
  }


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

  getOuterNumberX(index: number, total: number) {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    const outerRadius = this.R + 25; // 25px outside the main circle
    return outerRadius * Math.cos(angle);
  }

  getOuterNumberY(index: number, total: number) {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    const outerRadius = this.R + 25; // 25px outside the main circle
    return outerRadius * Math.sin(angle);
  }

  getPhaseMarkX(dayIndex: number, total: number) {
    const angle = (2 * Math.PI * dayIndex) / total - Math.PI / 2;
    const phaseRadius = this.R + 15; // 15px outside the main circle
    return phaseRadius * Math.cos(angle);
  }

  getPhaseMarkY(dayIndex: number, total: number) {
    const angle = (2 * Math.PI * dayIndex) / total - Math.PI / 2;
    const phaseRadius = this.R + 15; // 15px outside the main circle
    return phaseRadius * Math.sin(angle);
  }

  isToday(value: number): boolean {
    // value is 1..cycleLength label on ring, todayCycleDay is also 1-based
    return value === this.todayCycleDay;
  }

  private updatePositions() {
    // today dot (use todayCycleDay, which is now 1-based)
    const todayAngle =
      (this.todayCycleDay / this.cycleLength) * 2 * Math.PI - Math.PI / 2;
    this.todayX = 140 * Math.cos(todayAngle);
    this.todayY = 140 * Math.sin(todayAngle);

    // ovulation heart at ovulationDay (1-based index)
    const ovAngle =
      ((this.ovulationDay - 1) / this.cycleLength) * 2 * Math.PI - Math.PI / 2;
    this.ovulationX = 140 * Math.cos(ovAngle);
    this.ovulationY = 140 * Math.sin(ovAngle);
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
    event.preventDefault();
    event.stopPropagation();
    
    // Don't open if already open
    if (this.showPeriodSheet) {
      return;
    }
    
    // Open the modal
    this.showPeriodSheet = true;
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

  getCycleStatusText(): string {
    if (this.todayCycleDay <= 0) return 'Start tracking';
    if (this.todayCycleDay <= this.periodLength) return 'Period Phase';
    if (this.todayCycleDay <= this.ovulationDay - 5) return 'Follicular Phase';
    if (this.todayCycleDay <= this.ovulationDay + 1) return 'Fertile Window';
    if (this.todayCycleDay <= this.cycleLength - this.pmsLength) return 'Luteal Phase';
    return 'PMS Phase';
  }

  getCyclePhaseText(): string {
    if (this.todayCycleDay <= 0) return 'Log your period to begin';
    if (this.todayCycleDay <= this.periodLength) return `Day ${this.todayCycleDay} of period`;
    if (this.todayCycleDay <= this.ovulationDay - 5) return 'Preparing for ovulation';
    if (this.todayCycleDay <= this.ovulationDay + 1) return 'High fertility chance';
    if (this.todayCycleDay <= this.cycleLength - this.pmsLength) return 'Post-ovulation phase';
    return 'Pre-menstrual phase';
  }

  getNextMilestoneText(): string {
    if (this.todayCycleDay <= 0) return 'Log your period';
    if (this.todayCycleDay <= this.periodLength) {
      const daysLeft = this.periodLength - this.todayCycleDay;
      return daysLeft > 0 ? `${daysLeft} days left` : 'Period ending';
    }
    if (this.todayCycleDay < this.ovulationDay - 5) {
      const daysToFertile = (this.ovulationDay - 5) - this.todayCycleDay;
      return `${daysToFertile} days to fertile window`;
    }
    if (this.todayCycleDay <= this.ovulationDay + 1) {
      const daysToOvulation = this.ovulationDay - this.todayCycleDay;
      return daysToOvulation > 0 ? `${daysToOvulation} days to ovulation` : 'Ovulation day';
    }
    if (this.todayCycleDay < this.cycleLength - this.pmsLength) {
      const daysToPMS = (this.cycleLength - this.pmsLength) - this.todayCycleDay;
      return `${daysToPMS} days to PMS`;
    }
    const daysToNextPeriod = this.cycleLength - this.todayCycleDay;
    return `${daysToNextPeriod} days to next period`;
  }

  getFertilityStatus() {
    if (this.todayCycleDay <= this.periodLength) {
      return {
        status: 'Period Days',
        description: 'Low chance of pregnancy',
        color: '#ef4444',
        icon: '🩸'
      };
    } else if (this.todayCycleDay <= this.periodLength + 3) {
      return {
        status: 'Low Chance Days',
        description: 'Very low chance of pregnancy',
        color: '#f97316',
        icon: '📅'
      };
    } else if (this.todayCycleDay <= this.ovulationDay - 3) {
      return {
        status: 'Medium Chance Days',
        description: 'Moderate chance of pregnancy',
        color: '#eab308',
        icon: '🌱'
      };
    } else if (this.todayCycleDay <= this.ovulationDay + 1) {
      return {
        status: 'High Fertility Days',
        description: 'Peak fertility - highest chance',
        color: '#10b981',
        icon: '💚'
      };
    } else if (this.todayCycleDay <= this.ovulationDay + 7) {
      return {
        status: 'Post-Ovulation',
        description: 'Lower chance of pregnancy',
        color: '#8b5cf6',
        icon: '🌙'
      };
    } else {
      return {
        status: 'Pre-Menstrual',
        description: 'Very low chance of pregnancy',
        color: '#ec4899',
        icon: '🌊'
      };
    }
  }

  getDaysUntilFertileWindow() {
    const nextCycleStart = this.cycleLength - this.todayCycleDay + 1;
    const nextFertileStart = nextCycleStart + this.periodLength + 3;
    return nextFertileStart;
  }

  getDaysUntilOvulation() {
    if (this.todayCycleDay < this.ovulationDay) {
      return this.ovulationDay - this.todayCycleDay;
    } else if (this.todayCycleDay === this.ovulationDay) {
      return 0; // Today is ovulation day
    } else {
      return this.getDaysUntilFertileWindow() + (this.ovulationDay - this.periodLength - 3);
    }
  }

  getDetailedMilestone() {
    const fertility = this.getFertilityStatus();
    const daysUntilOvulation = this.getDaysUntilOvulation();
    
    if (this.todayCycleDay < this.ovulationDay) {
      return `Ovulation in ${daysUntilOvulation} day${daysUntilOvulation !== 1 ? 's' : ''}`;
    } else if (this.todayCycleDay === this.ovulationDay) {
      return 'Today is ovulation day!';
    } else if (this.todayCycleDay < this.ovulationDay + 7) {
      return `Post-ovulation phase (${this.todayCycleDay - this.ovulationDay} day${this.todayCycleDay - this.ovulationDay !== 1 ? 's' : ''} past)`;
    } else {
      const daysUntilPeriod = this.cycleLength - this.todayCycleDay + 1;
      return `Next period in ${daysUntilPeriod} day${daysUntilPeriod !== 1 ? 's' : ''}`;
    }
  }

  // Progress loader calculation
  getProgressOffset(): number {
    if (this.todayCycleDay <= 0) return 753.98; // Full circle (no progress)
    
    const progress = this.todayCycleDay / this.cycleLength;
    const circumference = 2 * Math.PI * 120; // 2πr where r=120
    return circumference * (1 - progress);
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
    this.periodDayNumbers = Array.from({ length: this.periodLength }, (_, i) => i + 1);
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

    // compute today cycle day relative to last period start (1-based)
    if (this.startDate) {
      const start = new Date(this.startDate);
      const diffDays = Math.floor(
        (this.todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      const mod = ((diffDays % this.cycleLength) + this.cycleLength) % this.cycleLength;
      this.todayCycleDay = mod + 1; // Convert to 1-based day numbering
    } else {
      // fallback: keep current day index within cycle length (not ideal but avoids NaN)
      const todayNum = new Date().getDate();
      this.todayCycleDay = ((todayNum - 1) % this.cycleLength + this.cycleLength) % this.cycleLength + 1;
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
    
    // Force change detection to update the view
    this.cdr.detectChanges();
  }
}
