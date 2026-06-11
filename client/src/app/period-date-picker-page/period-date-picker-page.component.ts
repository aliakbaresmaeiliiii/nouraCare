import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeOutline } from 'ionicons/icons';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import {
  PeriodDatePickerComponent,
  PeriodDateRange,
} from '../shared/components/period-date-picker/period-date-picker.component';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { HomeDataService } from '../home/services/home-data.service';
import { PeriodCycleStateService } from '../shared/services/period-cycle-state.service';
import { LanguageService } from '../shared/services/language.service';
import { formatHistoryDayDate } from '../shared/utils/locale-date-format.util';

@Component({
  selector: 'app-period-date-picker-page',
  templateUrl: './period-date-picker-page.component.html',
  styleUrls: ['./period-date-picker-page.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, PeriodDatePickerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PeriodDatePickerPageComponent implements OnInit {
  constructor() {
    addIcons({ checkmarkCircle, closeOutline });
  }

  /** Set when opened as a modal (e.g. from cycle calendar). */
  @Input() initialStartIso: string | null = null;
  /** When true, pre-select today instead of the previous period start (log-period flow). */
  @Input() defaultToToday = false;

  periodLength = 5;
  cycleLength = 28;
  selectedRange: PeriodDateRange | null = null;

  private modalController = inject(ModalController);
  private router = inject(Router);
  private location = inject(Location);
  private cycleSettings = inject(CycleSettingsService);
  private periodCycleState = inject(PeriodCycleStateService);
  private homeData = inject(HomeDataService);
  private languageService = inject(LanguageService);

  ngOnInit() {
    this.periodLength = this.cycleSettings.periodLength();
    this.cycleLength = this.cycleSettings.cycleLength();
    if (this.defaultToToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      this.selectedRange = this.buildInitialRangeFromDate(today);
      return;
    }
    this.initialStartIso =
      this.initialStartIso ?? this.cycleSettings.lastPeriodStartDate();
    this.selectedRange = this.buildInitialRange(this.initialStartIso);
  }

  onRangeSelected(range: PeriodDateRange) {
    this.selectedRange = range;
  }

  formatSummaryDate(date: Date): string {
    return formatHistoryDayDate(date, this.languageService.getCurrentLanguage());
  }

  private buildInitialRange(startIso: string | null): PeriodDateRange | null {
    if (!startIso) return null;
    const part = startIso.split('T')[0];
    const [y, m, d] = part.split('-').map((n) => parseInt(n, 10));
    if (!y || !m || !d) return null;
    return this.buildInitialRangeFromDate(new Date(y, m - 1, d));
  }

  private buildInitialRangeFromDate(startDate: Date): PeriodDateRange {
    const normalizedStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const periodDates: Date[] = [];
    for (let i = 0; i < this.periodLength; i++) {
      const date = new Date(normalizedStart);
      date.setDate(normalizedStart.getDate() + i);
      periodDates.push(date);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      startDate: normalizedStart,
      periodDates,
      isPastDate: normalizedStart < today,
      isToday: normalizedStart.toDateString() === today.toDateString(),
    };
  }

  private toLocalIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async savePeriod() {
    if (!this.selectedRange?.startDate) return;

    const onPickerRoute = this.router.url
      .split('?')[0]
      .includes('/period-date-picker');
    if (!onPickerRoute) {
      await this.modalController.dismiss(this.selectedRange);
      return;
    }
    const iso = this.toLocalIsoDate(this.selectedRange.startDate);
    const userId = this.homeData.getCurrentUserId();
    await this.periodCycleState.savePeriodStart(userId, {
      lastPeriodDateIso: iso,
      averagePeriodDuration: this.periodLength,
      mood: '',
      notes: '',
    });
    this.cycleSettings.isPregnant.set(false);
    this.cycleSettings.setUserStatus('Trying to Conceive');
    this.cycleSettings.setPostpartumStatus(false);

    await this.router.navigate(['/tabs/home']);
  }

  async cancel() {
    const onPickerRoute = this.router.url
      .split('?')[0]
      .includes('/period-date-picker');
    if (!onPickerRoute) {
      await this.modalController.dismiss();
      return;
    }
    this.location.back();
  }
}
