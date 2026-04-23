import {
  Component,
  effect,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { IonDatetime } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';
import { CycleSettingsService } from '../../services/cycle-settings.service';
import { UserInfoService } from '../../services/user-info.service';
import type { UserInfo } from '../../interfaces/user-info-api.interface';
import { AuthService } from '../../../auth/services/auth';
import { TranslationService } from '../../services/translation.service';
import { LanguageService } from '../../services/language.service';
import {
  formatCyclePhaseShortDate,
  formatCycleStripCenterDate,
  weekStripDayOfMonth,
  weekStripWeekdayShort,
} from '../../utils/locale-date-format.util';

export interface Segment {
  label: string;
  days: number;
  color: string;
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
  @ViewChild('cycleChartWeekScroll', { read: ElementRef })
  cycleChartWeekScroll?: ElementRef<HTMLElement>;

  router = inject(Router);
  private cycleSettings = inject(CycleSettingsService);
  private userInfoService = inject(UserInfoService);
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private languageService = inject(LanguageService);
  private cdr = inject(ChangeDetectorRef);
  // Configuration inputs
  @Input() cycleLength: number = 28; // total cycle length in days
  @Input() periodLength: number = 5; // menstruation length in days
  /** When true, shows the Mon–Sun week strip above the ring (cycle home). */
  @Input() showWeekStrip = true;

  private readonly weekCalWeeksPast = 10;
  private readonly weekCalWeeksFuture = 10;
  /** Mirrors home “selected day” for the strip; null → highlight today. */
  private weekCalendarSelectedIsoKey: string | null = null;

  // Computed state
  @Input() ovulationDay: number = 14; // computed from cycleLength in ngOnInit
  segments: { start: number; len: number; color: string }[] = [];

  // User selections
  startDate: string | null = null; // last period start (YYYY-MM-DD)
  endDate: string | null = null; // last period end (YYYY-MM-DD)

  /**
   * Cycle day (1‑based) for the date in focus: an explicit week‑strip tap, otherwise **today**.
   * Ring marker, center copy, and disk tint follow this (not a frozen “wall clock” slice).
   */
  get viewCycleDay(): number {
    if (!this.startDate) {
      return Math.max(1, this.todayCycleDay || 1);
    }
    const strip = this.getSelectedStripCalendarDate();
    const cd = this.cycleDayForCalendarDate(strip);
    return cd != null && cd >= 1 ? cd : Math.max(1, this.todayCycleDay || 1);
  }

  /** True when no explicit calendar day is selected (strip follows today). */
  viewingCalendarToday(): boolean {
    return this.weekCalendarSelectedIsoKey == null;
  }

  getStripViewDate(): Date {
    return this.getSelectedStripCalendarDate();
  }

  /** Gregorian or Jalali string for the focused day above the ring. */
  formatStripCenterDate(): string {
    return formatCycleStripCenterDate(
      this.getStripViewDate(),
      this.languageService.getCurrentLanguage(),
    );
  }

  /** Main headline under the calendar date (e.g. “Period day 4” or “Day 11 of your cycle”). */
  getCenterCycleHeading(): string {
    if (!this.startDate) {
      return this.t('cycleChart.heading.logPeriodToBegin');
    }
    const d = this.viewCycleDay;
    if (d >= 1 && d <= this.periodLength) {
      return this.t('cycleChart.heading.periodDay', { day: d });
    }
    return this.t('cycleChart.heading.dayOfCycle', { day: d });
  }

  // Period status (driven by **view** day so taps update the ring + center)
  get isInPeriod(): boolean {
    return this.viewCycleDay >= 1 && this.viewCycleDay <= this.periodLength;
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
    return (
      this.viewCycleDay >= this.fertileWindowStart &&
      this.viewCycleDay <= this.fertileWindowEnd
    );
  }

  get isOvulationDay(): boolean {
    return this.viewCycleDay === this.ovulationDay;
  }

  get pmsStart(): number {
    // PMS typically starts 5-7 days before next period
    return Math.max(1, this.cycleLength - 6);
  }

  get pmsEnd(): number {
    return this.cycleLength;
  }

  get isInPMS(): boolean {
    return (
      this.viewCycleDay >= this.pmsStart && this.viewCycleDay <= this.pmsEnd
    );
  }

  /** Drives outer ring disk tint (period vs fertile vs peak ovulation). */
  get cycleDiskPhase(): 'none' | 'period' | 'fertile' | 'ovulation' {
    if (!this.startDate || this.viewCycleDay < 1) {
      return 'none';
    }
    if (this.isInPeriod) {
      return 'period';
    }
    if (this.isOvulationDay) {
      return 'ovulation';
    }
    if (this.isInFertileWindow) {
      return 'fertile';
    }
    return 'none';
  }

  /** SVG radial fill for the large background disk behind the ring. */
  get cycleDiskBackgroundFill(): string {
    switch (this.cycleDiskPhase) {
      case 'period':
        return 'url(#centerGradientPeriod)';
      case 'ovulation':
        return 'url(#centerGradientOvulationPeak)';
      case 'fertile':
        return 'url(#centerGradientFertile)';
      default:
        return 'url(#centerGradient)';
    }
  }

  // Reactive effects - must be field initializers for injection context
  private watchUserInfo = effect(() => {
    const userInfo = this.userInfoService.onboardingJourney();
    if (userInfo) {
      this.cycleLength = userInfo.cycleLength || 28;
      this.periodLength = userInfo.periodLength || 5;
      this.startDate = this.toPeriodIso(userInfo.lastPeriodDate);
      if (this.startDate) {
        this.endDate = this.addDaysToIso(this.startDate, this.periodLength - 1);
      }
      this.recomputeEverything();
      this.syncWeekCalendarSelectionFromStartDate();
      queueMicrotask(() => this.scheduleWeekScrollToAnchor());
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
    } else {
      this.endDate = null;
    }
    this.recomputeEverything();
    this.syncWeekCalendarSelectionFromStartDate();
    queueMicrotask(() => this.scheduleWeekScrollToAnchor());
  });

  // Today
  todayDate: Date = new Date();
  todayCycleDay: number = 0; // 1-based day number in current cycle relative to startDate
  radius = 230;
  circumference = 2 * Math.PI * this.radius;

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

  openPicker(_type: 'start' | 'end') {
    this.showPicker = false;
    this.showPeriodSheet = false;
    void this.router.navigate(['/cycle-calendar']);
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
    // Paint immediately from local journey / cycle store; home already syncs onboarding in parallel.
    this.applyLocalCycleState();
    this.recomputeEverything();
    this.syncWeekCalendarSelectionFromStartDate();
    this.scheduleWeekScrollToAnchor();
    this.refreshOnboardingFromServer();
  }

  private applyUserInfoToChart(userInfo: UserInfo): void {
    this.cycleLength = userInfo.cycleLength || 28;
    this.periodLength = userInfo.periodLength || 5;
    this.startDate = this.toPeriodIso(userInfo.lastPeriodDate);
    if (this.startDate) {
      this.endDate = this.addDaysToIso(this.startDate, this.periodLength - 1);
    } else {
      this.endDate = null;
    }
  }

  /** Prefer in-memory journey row, else persisted cycle settings (same source home hydrates before network). */
  private applyLocalCycleState(): void {
    const journey = this.userInfoService.onboardingJourney();
    if (journey) {
      this.applyUserInfoToChart(journey);
      return;
    }
    this.cycleLength = this.cycleSettings.cycleLength();
    this.periodLength = this.cycleSettings.periodLength();
    const lp = this.cycleSettings.lastPeriodStartDate();
    this.startDate = (lp as string) || null;
    if (this.startDate) {
      this.endDate = this.addDaysToIso(this.startDate, this.periodLength - 1);
    } else {
      this.endDate = null;
    }
  }

  private toPeriodIso(raw: string | Date | null | undefined): string | null {
    if (raw == null) {
      return null;
    }
    if (typeof raw === 'string') {
      return raw.split('T')[0];
    }
    return raw.toISOString().split('T')[0];
  }

  /**
   * Refresh journey from server without hiding the chart (GET is duplicated with home sync but stays non-blocking).
   */
  private refreshOnboardingFromServer(): void {
    if (!this.authService.getAccessToken()) {
      return;
    }
    this.userInfoService.getUserOnboardingData().subscribe({
      next: (userInfo) => {
        this.applyUserInfoToChart(userInfo);
        this.recomputeEverything();
        this.syncWeekCalendarSelectionFromStartDate();
        queueMicrotask(() => this.scheduleWeekScrollToAnchor());
      },
      error: () => {
        this.applyLocalCycleState();
        this.recomputeEverything();
        this.syncWeekCalendarSelectionFromStartDate();
        queueMicrotask(() => this.scheduleWeekScrollToAnchor());
      },
    });
  }

  /**
   * Public method to manually refresh the chart
   * This can be called from parent components when data changes
   */
  public refreshChart() {
    this.applyLocalCycleState();
    this.recomputeEverything();
    this.syncWeekCalendarSelectionFromStartDate();
    queueMicrotask(() => this.scheduleWeekScrollToAnchor());
    this.refreshOnboardingFromServer();
  }

  /**
   * Debug method to check current state
   */
  public debugState() {}

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
    // Highlight the **focused** cycle day on the ring (selected strip day or today).
    return value === this.viewCycleDay;
  }

  private updatePositions() {
    // ovulation heart at ovulationDay (1-based index)
    const ovAngle =
      ((this.ovulationDay - 1) / this.cycleLength) * 2 * Math.PI - Math.PI / 2;
    this.ovulationX = 140 * Math.cos(ovAngle);
    this.ovulationY = 140 * Math.sin(ovAngle);
    this.ovulationRotation = (ovAngle * 180) / Math.PI + 90;

    // period label at middle of period arc, slightly outside ring
    const periodMidAngle =
      ((0 + this.periodLength / 2) / this.cycleLength) * 2 * Math.PI -
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
    event.preventDefault();
    event.stopPropagation();
    this.showPeriodSheet = false;
    void this.router.navigate(['/cycle-calendar']);
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

    this.periodLength =
      isFinite(actualPeriodLength) && actualPeriodLength > 0
        ? actualPeriodLength
        : this.periodLength;

    this.recomputeEverything();
    this.closePeriodSheet();
  }

  activePicker: 'start' | 'end' | null = null;

  onChange(ev: any, type: 'year' | 'month' | 'day') {
    if (type === 'year') this.tempYear = +ev.detail.value;
    if (type === 'month') this.tempMonth = +ev.detail.value;
    if (type === 'day') this.tempDay = +ev.detail.value;
  }

  /** Highlights the current calendar year in the wheel (local date). */
  isPickerYearToday(y: number): boolean {
    return y === new Date().getFullYear();
  }

  /** Highlights the current month when the year wheel matches this year. */
  isPickerMonthToday(m: number): boolean {
    const t = new Date();
    return m === t.getMonth() + 1 && this.tempYear === t.getFullYear();
  }

  /** Highlights today's calendar day when year + month wheels match today. */
  isPickerDayToday(d: number): boolean {
    const t = new Date();
    return (
      d === t.getDate() &&
      this.tempMonth === t.getMonth() + 1 &&
      this.tempYear === t.getFullYear()
    );
  }

  closePicker() {
    this.showPicker = false;
  }

  confirmPicker() {
    this.showPicker = false;
    void this.router.navigate(['/cycle-calendar']);
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
    this.openPicker('start');
  }

  /** Wheel modal title: which period boundary is being edited. */
  get pickerModalTitle(): string {
    return this.pickerType === 'start'
      ? this.t('cycleChart.picker.firstDayLastPeriod')
      : this.t('cycleChart.picker.lastDayThisPeriod');
  }

  savePeriod() {
    this.closePeriodSheet();
    void this.router.navigate(['/cycle-calendar']);
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
    return formatCyclePhaseShortDate(d, this.languageService.getCurrentLanguage());
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
    const d = new Date(
      this.addDaysToIso(this.startDate, this.ovulationDay - 1),
    );
    return this.formatDateShort(d);
  }

  get pmsStartLabel(): string {
    if (!this.startDate) return '-';
    const pmsStart = this.cycleLength - 5;
    const d = new Date(this.addDaysToIso(this.startDate, pmsStart));
    return this.formatDateShort(d);
  }

  getCycleStatusText(): string {
    const cd = this.viewCycleDay;
    if (cd <= 0) return this.t('cycleChart.status.startTracking');
    if (cd <= this.periodLength) return this.t('cycleChart.status.periodPhase');
    if (cd <= this.ovulationDay - 5) return this.t('cycleChart.status.follicularPhase');
    if (cd <= this.ovulationDay + 1) return this.t('cycleChart.status.fertileWindow');
    if (cd <= this.cycleLength - this.pmsLength) return this.t('cycleChart.status.lutealPhase');
    return this.t('cycleChart.status.pmsPhase');
  }

  getCyclePhaseText(): string {
    const cd = this.viewCycleDay;
    if (cd <= 0) return this.t('cycleChart.phase.logPeriodToBegin');
    if (cd <= this.periodLength) return this.t('cycleChart.phase.dayOfPeriod', { day: cd });
    if (cd <= this.ovulationDay - 5) return this.t('cycleChart.phase.preparingOvulation');
    if (cd <= this.ovulationDay + 1) return this.t('cycleChart.phase.highFertilityChance');
    if (cd <= this.cycleLength - this.pmsLength) return this.t('cycleChart.phase.postOvulation');
    return this.t('cycleChart.phase.preMenstrual');
  }

  getNextMilestoneText(): string {
    const cd = this.viewCycleDay;
    if (cd <= 0) return this.t('cycleChart.milestone.logPeriod');
    if (cd <= this.periodLength) {
      const daysLeft = this.periodLength - cd;
      return daysLeft > 0
        ? this.t('cycleChart.milestone.daysBleedingLeft', {
            days: daysLeft,
            dayWord: this.dayWord(daysLeft),
          })
        : this.t('cycleChart.milestone.lastDayPeriod');
    }
    if (cd < this.ovulationDay - 5) {
      const daysToFertile = this.ovulationDay - 5 - cd;
      return this.t('cycleChart.milestone.daysToFertileWindow', {
        days: daysToFertile,
        dayWord: this.dayWord(daysToFertile),
      });
    }
    if (cd <= this.ovulationDay + 1) {
      const daysToOvulation = this.ovulationDay - cd;
      return daysToOvulation > 0
        ? this.t('cycleChart.milestone.daysToOvulation', {
            days: daysToOvulation,
            dayWord: this.dayWord(daysToOvulation),
          })
        : this.t('cycleChart.milestone.ovulationDay');
    }
    if (cd < this.cycleLength - this.pmsLength) {
      const daysToPMS = this.cycleLength - this.pmsLength - cd;
      return this.t('cycleChart.milestone.daysToPms', {
        days: daysToPMS,
        dayWord: this.dayWord(daysToPMS),
      });
    }
    const daysToNextPeriod = this.cycleLength - cd;
    return this.t('cycleChart.milestone.daysToNextPeriod', {
      days: daysToNextPeriod,
      dayWord: this.dayWord(daysToNextPeriod),
    });
  }

  /**
   * Calendar‑method fertility copy for the **focused** day.
   * Ovulation is estimated as cycle day `periodLength + 2` (two days after bleeding ends);
   * fertile window = ovulation−5 … ovulation+1 (six‑day window + day after O).
   */
  getFertilityStatus(): {
    status: string;
    description: string;
    color: string;
    icon: string;
    tone: 'rose' | 'amber' | 'mint' | 'emerald' | 'violet' | 'pink' | 'slate';
  } {
    const d = this.viewCycleDay;
    if (!this.startDate || d <= 0) {
      return {
        status: this.t('cycleChart.fertility.getStarted'),
        description: this.t('cycleChart.fertility.logLastPeriodEstimate'),
        color: '#64748b',
        icon: '📅',
        tone: 'slate',
      };
    }
    if (d <= this.periodLength) {
      return {
        status: this.t('cycleChart.fertility.period'),
        description: this.t('cycleChart.fertility.veryLowDuringMenstruation'),
        color: '#9b4a63',
        icon: '🩸',
        tone: 'rose',
      };
    }
    if (d <= this.periodLength + 3) {
      return {
        status: this.t('cycleChart.fertility.earlyCycle'),
        description: this.t('cycleChart.fertility.veryLowHormonesResetting'),
        color: '#f97316',
        icon: '📅',
        tone: 'amber',
      };
    }
    if (d < this.fertileWindowStart) {
      return {
        status: this.t('cycleChart.fertility.follicularPhase'),
        description: this.t('cycleChart.fertility.lowerChanceFollicleDeveloping'),
        color: '#ca8a04',
        icon: '🌱',
        tone: 'amber',
      };
    }
    if (d < this.ovulationDay - 1) {
      return {
        status: this.t('cycleChart.fertility.fertileWindow'),
        description: this.t('cycleChart.fertility.chanceRising'),
        color: '#0f766e',
        icon: '💚',
        tone: 'mint',
      };
    }
    if (d <= this.ovulationDay + 1) {
      const peak = d === this.ovulationDay;
      return {
        status: peak
          ? this.t('cycleChart.fertility.ovulation')
          : this.t('cycleChart.fertility.peakFertileDays'),
        description: peak
          ? this.t('cycleChart.fertility.highestChanceThisCycle')
          : this.t('cycleChart.fertility.highChanceInWindow'),
        color: '#0d9488',
        icon: '💚',
        tone: 'emerald',
      };
    }
    if (d <= this.ovulationDay + 4) {
      return {
        status: this.t('cycleChart.fertility.justAfterOvulation'),
        description: this.t('cycleChart.fertility.lowerThanPeakEggHours'),
        color: '#8b5cf6',
        icon: '🌙',
        tone: 'violet',
      };
    }
    if (d <= this.cycleLength - this.pmsLength) {
      return {
        status: this.t('cycleChart.fertility.lutealPhase'),
        description: this.t('cycleChart.fertility.lowerChanceUntilNextCycle'),
        color: '#7c3aed',
        icon: '🌙',
        tone: 'violet',
      };
    }
    return {
      status: this.t('cycleChart.fertility.preMenstrual'),
      description: this.t('cycleChart.fertility.veryLowBeforeNextPeriod'),
      color: '#db2777',
      icon: '🌊',
      tone: 'pink',
    };
  }

  getDaysUntilFertileWindow() {
    const nextCycleStart = this.cycleLength - this.todayCycleDay + 1;
    const nextFertileStart = nextCycleStart + this.periodLength + 3;
    return nextFertileStart;
  }

  getDaysUntilOvulation(): number {
    const cd = this.viewCycleDay;
    if (cd < this.ovulationDay) {
      return this.ovulationDay - cd;
    }
    if (cd === this.ovulationDay) {
      return 0;
    }
    return this.cycleLength - cd + this.ovulationDay;
  }

  getDetailedMilestone(): string {
    const cd = this.viewCycleDay;
    if (!this.startDate || cd < 1) {
      return '';
    }
    if (cd < this.ovulationDay) {
      const n = this.ovulationDay - cd;
      return this.t('cycleChart.detail.ovulationIn', {
        days: n,
        dayWord: this.dayWord(n),
      });
    }
    if (cd === this.ovulationDay) {
      return this.t('cycleChart.detail.ovulationDayHighestChance');
    }
    if (cd <= this.ovulationDay + 7) {
      const past = cd - this.ovulationDay;
      return this.t('cycleChart.detail.daysAfterOvulation', {
        days: past,
        dayWord: this.dayWord(past),
      });
    }
    const daysUntilPeriod = this.cycleLength - cd + 1;
    return this.t('cycleChart.detail.nextPeriodAbout', {
      days: daysUntilPeriod,
      dayWord: this.dayWord(daysUntilPeriod),
    });
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
    this.periodDayNumbers = Array.from(
      { length: this.periodLength },
      (_, i) => i + 1,
    );
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

  getWeekCalendarWeeks(): {
    weekKey: string;
    days: {
      label: string;
      dateNum: number;
      isToday: boolean;
      isoKey: string;
      fullDate: Date;
    }[];
  }[] {
    const today = new Date();
    const anchorMonday = this.getWeekMonday(today);
    const lang = this.languageService.getCurrentLanguage();
    const weeks: {
      weekKey: string;
      days: {
        label: string;
        dateNum: number;
        isToday: boolean;
        isoKey: string;
        fullDate: Date;
      }[];
    }[] = [];

    for (let w = -this.weekCalWeeksPast; w <= this.weekCalWeeksFuture; w++) {
      const monday = new Date(anchorMonday);
      monday.setDate(anchorMonday.getDate() + w * 7);
      const days: {
        label: string;
        dateNum: number;
        isToday: boolean;
        isoKey: string;
        fullDate: Date;
      }[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const uToday = Date.UTC(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        const uD = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        const isToday = uD === uToday;
        const isoKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const dayRow = {
          fullDate: d,
          isToday,
          isoKey,
        };
        let label = isToday
          ? this.t('cycleChart.week.today')
          : weekStripWeekdayShort(d, lang);
        if (!isToday && this.isWeekDayLastPeriodDay(dayRow)) {
          label = this.t('cycleChart.week.last');
        }
        days.push({
          label,
          dateNum: weekStripDayOfMonth(d, lang),
          isToday,
          isoKey,
          fullDate: d,
        });
      }

      weeks.push({
        weekKey: `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`,
        days,
      });
    }

    return weeks;
  }

  isWeekDaySelected(d: { isToday: boolean; isoKey: string }): boolean {
    if (this.weekCalendarSelectedIsoKey) {
      return d.isoKey === this.weekCalendarSelectedIsoKey;
    }
    return d.isToday;
  }

  isWeekDayInPeriod(d: { fullDate: Date }): boolean {
    if (!this.startDate) {
      return false;
    }
    const start = new Date(
      this.startDate.includes('T')
        ? this.startDate
        : `${this.startDate}T12:00:00`,
    );
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + this.periodLength - 1);
    const t = new Date(
      d.fullDate.getFullYear(),
      d.fullDate.getMonth(),
      d.fullDate.getDate(),
    );
    return t >= start && t <= end;
  }

  /** Last calendar day of the logged bleeding range (often lighter / “tail” UI). */
  isWeekDayLastPeriodDay(d: { fullDate: Date }): boolean {
    if (!this.startDate || !this.isWeekDayInPeriod(d)) {
      return false;
    }
    const start = new Date(
      this.startDate.includes('T')
        ? this.startDate
        : `${this.startDate}T12:00:00`,
    );
    start.setHours(0, 0, 0, 0);
    const last = new Date(start);
    last.setDate(start.getDate() + this.periodLength - 1);
    const t = new Date(
      d.fullDate.getFullYear(),
      d.fullDate.getMonth(),
      d.fullDate.getDate(),
    );
    t.setHours(0, 0, 0, 0);
    return t.getTime() === last.getTime();
  }

  /**
   * Predicted ovulation on this calendar day (same `ovulationDay` as the ring), including today.
   * Skipped when that day is inside the logged bleeding range.
   */
  isWeekDayPredictedOvulation(d: { fullDate: Date }): boolean {
    if (!this.startDate) {
      return false;
    }
    const ovDay = this.effectiveOvulationCycleDay();
    if (ovDay < 1) {
      return false;
    }
    if (this.isWeekDayInPeriod(d)) {
      return false;
    }
    const cd = this.cycleDayForCalendarDate(d.fullDate);
    return cd != null && cd === ovDay;
  }

  /**
   * Other fertile‑window days (not ovulation peak) — mint styling on the week strip.
   */
  isWeekDayInFertileWindowStrip(d: { fullDate: Date }): boolean {
    if (!this.startDate || this.isWeekDayInPeriod(d)) {
      return false;
    }
    if (this.isWeekDayPredictedOvulation(d)) {
      return false;
    }
    const cd = this.cycleDayForCalendarDate(d.fullDate);
    if (cd == null) {
      return false;
    }
    return cd >= this.fertileWindowStart && cd <= this.fertileWindowEnd;
  }

  /** Selected day after period and before predicted ovulation (dashed “countdown” look). */
  isWeekDayPreOvulationSelected(d: {
    fullDate: Date;
    isToday: boolean;
    isoKey: string;
  }): boolean {
    if (!this.startDate || !this.isWeekDaySelected(d)) {
      return false;
    }
    if (this.isWeekDayInPeriod(d)) {
      return false;
    }
    if (this.isWeekDayPredictedOvulation(d)) {
      return false;
    }
    const cd = this.cycleDayForCalendarDate(d.fullDate);
    if (cd == null) {
      return false;
    }
    const ov = this.effectiveOvulationCycleDay();
    return cd > this.periodLength && cd < ov;
  }

  /**
   * Extra ring on the predicted ovulation cell when it is exactly 6 calendar days away
   * (matches “Ovulation in 6 days” in the today strip).
   */
  isWeekStripOvulationSixDaySpotlight(d: {
    fullDate: Date;
    isToday?: boolean;
  }): boolean {
    if (!this.startDate) {
      return false;
    }
    if (this.calendarDaysUntilNextPredictedOvulation() !== 6) {
      return false;
    }
    if (!this.isWeekDayPredictedOvulation(d)) {
      return false;
    }
    const nextOv = this.nextOvulationCalendarOnOrAfter(
      this.localMidnight(new Date()),
    );
    if (!nextOv) {
      return false;
    }
    return this.sameLocalCalendarDay(d.fullDate, nextOv);
  }

  /**
   * Countdown from the strip’s selected calendar day (LMP sync, a tap, or today when none).
   */
  get weekStripSelectionOvulationInsight(): string {
    if (!this.startDate) {
      return '';
    }
    const d = this.getSelectedStripCalendarDate();
    const nextOv = this.nextOvulationCalendarOnOrAfter(d);
    if (!nextOv) {
      return '';
    }
    const days = Math.round((nextOv.getTime() - d.getTime()) / 86400000);
    if (days < 0) {
      return '';
    }
    if (days === 0) {
      return this.t('cycleChart.insight.predictedOvulationDay');
    }
    if (days === 1) {
      return this.t('cycleChart.insight.ovulationTomorrow');
    }
    return this.t('cycleChart.insight.ovulationInDays', { days });
  }

  getViewContextText(): string {
    return this.viewingCalendarToday()
      ? this.t('cycleChart.view.todayOnCycle')
      : this.t('cycleChart.view.previewTapAnotherDay');
  }

  getPeriodLengthSummaryText(): string {
    return this.t('cycleChart.sheet.lengthThisPeriod', {
      days: this.periodDays,
      dayWord: this.dayWord(this.periodDays),
    });
  }

  getWheelPickerHint(): string {
    return this.t('cycleChart.picker.spinThenDone');
  }

  private dayWord(count: number): string {
    return count === 1
      ? this.t('cycleChart.common.day')
      : this.t('cycleChart.common.days');
  }

  private t(key: string, params?: Record<string, string | number>): string {
    const template = this.translationService.translate(key);
    if (!params) {
      return template;
    }
    return Object.entries(params).reduce(
      (acc, [paramKey, value]) =>
        acc.replace(new RegExp(`\\{\\{\\s*${paramKey}\\s*\\}\\}`, 'g'), String(value)),
      template,
    );
  }

  private getSelectedStripCalendarDate(): Date {
    if (this.weekCalendarSelectedIsoKey) {
      const parsed = this.parseWeekCalendarIsoKey(
        this.weekCalendarSelectedIsoKey,
      );
      if (parsed) {
        return parsed;
      }
    }
    return this.localMidnight(new Date());
  }

  private parseWeekCalendarIsoKey(key: string): Date | null {
    const parts = key.split('-').map((p) => Number(p));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
      return null;
    }
    const d = new Date(parts[0], parts[1], parts[2]);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Same index as the ring; falls back when `recomputeEverything` yields 0 for very short cycles. */
  private effectiveOvulationCycleDay(): number {
    if (this.ovulationDay >= 1) {
      return this.ovulationDay;
    }
    return Math.max(1, this.cycleLength - 14);
  }

  private localMidnight(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private startDateLocalMidnight(): Date | null {
    if (!this.startDate) {
      return null;
    }
    const d = new Date(
      this.startDate.includes('T')
        ? this.startDate
        : `${this.startDate}T12:00:00`,
    );
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private sameLocalCalendarDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /** Next calendar date ≥ `from` (local midnight) that is a predicted ovulation day. */
  private nextOvulationCalendarOnOrAfter(from: Date): Date | null {
    const start = this.startDateLocalMidnight();
    if (!start) {
      return null;
    }
    const ov = this.effectiveOvulationCycleDay();
    if (ov < 1) {
      return null;
    }
    const fromMid = this.localMidnight(from);
    let candidate = new Date(start);
    candidate.setDate(candidate.getDate() + (ov - 1));
    while (candidate.getTime() < fromMid.getTime()) {
      candidate.setDate(candidate.getDate() + this.cycleLength);
    }
    return candidate;
  }

  private calendarDaysUntilNextPredictedOvulation(): number | null {
    if (!this.startDate) {
      return null;
    }
    const today = this.localMidnight(new Date());
    const nextOv = this.nextOvulationCalendarOnOrAfter(today);
    if (!nextOv) {
      return null;
    }
    return Math.round((nextOv.getTime() - today.getTime()) / 86400000);
  }

  /** 1-based cycle day for a calendar date from `startDate` (LMP), wrapping by `cycleLength`. */
  private cycleDayForCalendarDate(d: Date): number | null {
    if (!this.startDate) {
      return null;
    }
    const start = new Date(
      this.startDate.includes('T')
        ? this.startDate
        : `${this.startDate}T12:00:00`,
    );
    start.setHours(0, 0, 0, 0);
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    t.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (t.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const mod =
      ((diffDays % this.cycleLength) + this.cycleLength) % this.cycleLength;
    return mod + 1;
  }

  onWeekDayPick(d: { isToday: boolean; isoKey: string; fullDate: Date }): void {
    if (d.isToday) {
      this.weekCalendarSelectedIsoKey = null;
      this.cycleSettings.setSelectedCycleViewDate(null);
      this.cdr.markForCheck();
      return;
    }
    this.weekCalendarSelectedIsoKey = d.isoKey;
    this.cycleSettings.setSelectedCycleViewDate(d.isoKey);
    this.cdr.markForCheck();
  }

  private syncWeekCalendarSelectionFromStartDate(): void {
    if (!this.startDate) {
      this.weekCalendarSelectedIsoKey = null;
      this.cycleSettings.setSelectedCycleViewDate(null);
      return;
    }
    // Keep highlight on **today** by default; user taps any date to preview that cycle day.
    this.weekCalendarSelectedIsoKey = null;
    this.cycleSettings.setSelectedCycleViewDate(null);
  }

  /** Parent can call after external refresh (replaces home `scheduleScrollCycleCalendarToAnchor`). */
  scheduleWeekScrollToAnchor(): void {
    if (!this.showWeekStrip) {
      return;
    }
    setTimeout(() => this.scrollWeekToAnchor(), 0);
  }

  private getWeekMonday(d: Date): Date {
    const x = new Date(d);
    const dow = x.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    x.setDate(x.getDate() + mondayOffset);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private weekUtcDayIndex(d: Date): number {
    return Math.floor(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000,
    );
  }

  private diffWeeksBetweenMondays(fromMonday: Date, toMonday: Date): number {
    return (
      (this.weekUtcDayIndex(toMonday) - this.weekUtcDayIndex(fromMonday)) / 7
    );
  }

  private scrollWeekToAnchor(): void {
    const host = this.cycleChartWeekScroll?.nativeElement;
    if (!host || host.clientWidth < 1) {
      return;
    }
    const ref =
      this.startDate != null
        ? new Date(
            this.startDate.includes('T')
              ? this.startDate
              : `${this.startDate}T12:00:00`,
          )
        : new Date();
    const anchorMonday = this.getWeekMonday(new Date());
    const refMonday = this.getWeekMonday(ref);
    const diffWeeks = this.diffWeeksBetweenMondays(anchorMonday, refMonday);
    const idx = Math.max(
      0,
      Math.min(
        this.weekCalWeeksPast + this.weekCalWeeksFuture,
        this.weekCalWeeksPast + diffWeeks,
      ),
    );
    const weekEl = host.children[idx] as HTMLElement | undefined;
    if (weekEl) {
      const prevBehavior = host.style.scrollBehavior;
      host.style.scrollBehavior = 'auto';
      host.scrollLeft = weekEl.offsetLeft;
      host.style.scrollBehavior = prevBehavior;
    } else {
      host.scrollLeft = idx * host.clientWidth;
    }
  }

  private recomputeEverything() {
    this.todayDate = new Date();

    // Predicted ovulation cycle day: two calendar days after last bleeding day
    // (last bleed = cycle day `periodLength` → ovulation at `periodLength + 2`).
    this.ovulationDay = Math.min(
      this.cycleLength,
      Math.max(1, this.periodLength + 2),
    );

    // refresh ring day labels
    this.ringDays = Array.from({ length: this.cycleLength }, (_, i) => i + 1);

    // compute today cycle day relative to last period start (1-based)
    if (this.startDate) {
      const start = new Date(this.startDate);
      const diffDays = Math.floor(
        (this.todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      const mod =
        ((diffDays % this.cycleLength) + this.cycleLength) % this.cycleLength;
      this.todayCycleDay = mod + 1; // Convert to 1-based day numbering
    } else {
      // fallback: keep current day index within cycle length (not ideal but avoids NaN)
      const todayNum = new Date().getDate();
      this.todayCycleDay =
        ((((todayNum - 1) % this.cycleLength) + this.cycleLength) %
          this.cycleLength) +
        1;
    }

    // rebuild segments
    this.segments = [];
    // Period segment starts at day 0 (cycle start) for periodLength days
    this.addSegmentWithWrap(0, this.periodLength, '#C21E56');

    // Fertile window: ovulationDay - 5 to ovulationDay + 1 (6 days)
    const fertileStart = this.ovulationDay - 5;
    this.addSegmentWithWrap(fertileStart, this.fertileWindowLength, '#063935');

    // Ovulation marker: very short segment at ovulationDay
    this.addSegmentWithWrap(this.ovulationDay, 0.6, '#ffd700');

    // PMS: last pmsLength days before next period
    this.addSegmentWithWrap(
      this.cycleLength - this.pmsLength,
      this.pmsLength,
      '#EE82EE',
    );

    // positions for today & ovulation
    this.updatePositions();

    // Force change detection to update the view
    this.cdr.detectChanges();
  }
}
