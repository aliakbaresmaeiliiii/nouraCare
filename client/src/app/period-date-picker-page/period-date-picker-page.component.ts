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
import { PeriodHistoryService } from '../shared/services/period-history.service';
import { ReproductiveStatusService } from '../shared/services/reproductive-status.service';
import { HomeDataService } from '../home/services/home-data.service';
import { firstValueFrom } from 'rxjs';

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

  /** Set when opened as a modal (e.g. from home) */
  @Input() initialStartIso: string | null = null;

  periodLength = 5;
  selectedRange: PeriodDateRange | null = null;

  private modalController = inject(ModalController);
  private router = inject(Router);
  private location = inject(Location);
  private cycleSettings = inject(CycleSettingsService);
  private periodHistory = inject(PeriodHistoryService);
  private reproductiveStatusService = inject(ReproductiveStatusService);
  private homeData = inject(HomeDataService);

  ngOnInit() {
    this.periodLength = this.cycleSettings.periodLength();
    this.initialStartIso =
      this.initialStartIso ?? this.cycleSettings.lastPeriodStartDate();
    this.selectedRange = this.buildInitialRange(this.initialStartIso);
  }

  onRangeSelected(range: PeriodDateRange) {
    this.selectedRange = range;
  }

  private buildInitialRange(startIso: string | null): PeriodDateRange | null {
    if (!startIso) return null;
    const part = startIso.split('T')[0];
    const [y, m, d] = part.split('-').map((n) => parseInt(n, 10));
    if (!y || !m || !d) return null;

    const startDate = new Date(y, m - 1, d);
    const periodDates: Date[] = [];
    for (let i = 0; i < this.periodLength; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      periodDates.push(date);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedStart = new Date(y, m - 1, d);

    return {
      startDate,
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

    const onPickerRoute = this.router.url.split('?')[0].includes('/period-date-picker');
    if (!onPickerRoute) {
      await this.modalController.dismiss(this.selectedRange);
      return;
    }

    const iso = this.toLocalIsoDate(this.selectedRange.startDate);
    const userId = this.homeData.getCurrentUserId();
    if (userId > 0) {
      try {
        await firstValueFrom(
          this.reproductiveStatusService.createPeriodLog(userId, {
            lastPeriodDate: iso,
            mood: '',
            notes: '',
            averagePeriodDuration: this.periodLength,
          }),
        );
      } catch (error) {
        console.error('Failed to persist period log:', error);
      }
    }
    this.cycleSettings.setLastPeriodStart(iso);
    this.cycleSettings.setSelectedCycleViewDate(null);
    this.cycleSettings.setUserStatus('Trying to Conceive');
    this.cycleSettings.setPregnancyStatus(false);
    this.cycleSettings.setPostpartumStatus(false);
    this.periodHistory.addEntry(iso);
    await this.router.navigate(['/tabs/home']);
  }

  async cancel() {
    const onPickerRoute = this.router.url.split('?')[0].includes('/period-date-picker');
    if (!onPickerRoute) {
      await this.modalController.dismiss();
      return;
    }
    this.location.back();
  }
}
