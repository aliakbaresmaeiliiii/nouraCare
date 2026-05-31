import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ModalController, PickerController } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';
import {
  formatJalaliFaFromIso,
  J_MONTHS,
  jalaliDaysInMonth,
  jalaliToIsoDate,
  toFa,
} from '../../shared/utils/jalali-iranian-calendar.util';
import {
  formatLocalizedNumber,
  formatHistoryDayDate,
  isPersianAppLanguage,
} from '../../shared/utils/locale-date-format.util';
import { LanguageService } from '../../shared/services/language.service';
import { TranslationService } from '../../shared/services/translation.service';

export interface CycleSetupSheetResult {
  lastPeriodDate: string;
  cycleLength: number;
  averagePeriodDuration: number;
}

@Component({
  selector: 'app-reproductive-status',
  templateUrl: './reproductive-status.component.html',
  styleUrls: ['./reproductive-status.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class ReproductiveStatusComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private cdr = inject(ChangeDetectorRef);
  private pickerCtrl = inject(PickerController);
  private languageService = inject(LanguageService);
  private translation = inject(TranslationService);

  maxDate = new Date().toISOString().split('T')[0];
  durationDaysNumber = Array.from({ length: 41 }, (_, i) => i + 20);
  bleedingDaysNumbers = Array.from({ length: 8 }, (_, i) => i + 3);
  isBleedingDaysOpen = false;
  isDurationDaysOpen = false;
  bleedingDays = 5;
  durationDays = 28;
  tempBleedingDays = 5;
  tempDurationDays = 28;
  periodDate = '';
  isPeriodDateOpen = false;
  periodDateIso = '';
  validationMessage = '';

  form = new FormGroup({
    durationDays: new FormControl(this.durationDays),
    bleedingDays: new FormControl(this.bleedingDays),
    periodStartIso: new FormControl(this.periodDateIso),
  });

  ngOnInit(): void {
    this.maxDate = new Date().toISOString().split('T')[0];
    const today = new Date();
    today.setDate(today.getDate() - 7);
    this.periodDateIso = today.toISOString().split('T')[0];
    this.form.patchValue({ periodStartIso: this.periodDateIso });
  }

  get displayDurationDays(): string {
    return this.formatDays(this.durationDays);
  }

  get displayBleedingDays(): string {
    return this.formatDays(this.bleedingDays);
  }

  get displayPeriodPickerDays(): string {
    if (!this.periodDateIso) {
      return '';
    }
    const lang = this.languageService.getCurrentLanguage();
    if (isPersianAppLanguage(lang)) {
      return formatJalaliFaFromIso(this.periodDateIso, 'DD MMMM YYYY');
    }
    const [y, m, d] = this.periodDateIso.split('-').map((n) => parseInt(n, 10));
    return formatHistoryDayDate(new Date(y, m - 1, d), lang);
  }

  formatDays(value: number): string {
    const unit = this.translation.translate('reproductiveStatus.daysUnit');
    const num = formatLocalizedNumber(value, this.languageService.getCurrentLanguage());
    return `${num} ${unit}`;
  }

  openBleedingDaysPicker() {
    if (this.isBleedingDaysOpen) return;
    this.tempBleedingDays = this.bleedingDays;
    this.isBleedingDaysOpen = true;
  }

  openDurationDaysPicker() {
    if (this.isDurationDaysOpen) return;
    this.tempDurationDays = this.durationDays;
    this.isDurationDaysOpen = true;
  }

  openPeriodDatePicker() {
    if (isPersianAppLanguage(this.languageService.getCurrentLanguage())) {
      void this.openJalaliPicker();
      return;
    }
    this.isPeriodDateOpen = true;
  }

  closeBleedingDays(role: 'cancel' | 'confirm') {
    if (role === 'confirm') {
      this.bleedingDays = Number(this.tempBleedingDays);
      this.form.patchValue({ bleedingDays: this.bleedingDays });
    }
    this.isBleedingDaysOpen = false;
  }

  closeDurationPicker(role: 'cancel' | 'confirm') {
    if (role === 'confirm') {
      this.durationDays = Number(this.tempDurationDays);
      this.form.patchValue({ durationDays: this.durationDays });
    }
    this.isDurationDaysOpen = false;
  }

  closePeriodDate(role: 'cancel' | 'confirm') {
    if (role === 'confirm') {
      this.periodDate = this.periodDateIso;
      this.form.patchValue({ periodStartIso: this.periodDateIso });
    }
    this.isPeriodDateOpen = false;
  }

  onDurationDaysChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value != null) {
      this.tempDurationDays = Number(value);
      this.form.get('durationDays')?.patchValue(value);
    }
  }

  onBleedingDaysChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value != null) {
      this.tempBleedingDays = Number(value);
      this.form.get('bleedingDays')?.patchValue(value);
    }
  }

  onPeriodDateChange(event: CustomEvent) {
    const value = (event.detail as { value?: string }).value as string;
    if (!value) return;
    this.periodDateIso = value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
    this.periodDate = this.periodDateIso;
    this.form.get('periodStartIso')?.patchValue(this.periodDateIso);
  }

  onPeriodDateDismiss() {
    this.isPeriodDateOpen = false;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async openJalaliPicker() {
    const now = new Date();
    const tempJ = (await import('jalaali-js')).toJalaali(now);

    const years = Array.from({ length: 60 }, (_, i) => 1360 + i);
    const yearCol = {
      name: 'year',
      selectedIndex: years.indexOf(tempJ.jy),
      options: years.map((y) => ({ text: toFa(y), value: y })),
    };

    const monthCol = {
      name: 'month',
      selectedIndex: tempJ.jm - 1,
      options: J_MONTHS.map((m, idx) => ({ text: m, value: idx + 1 })),
    };

    const makeDayCol = (jy: number, jm: number, selectedDay = 1) => {
      const len = jalaliDaysInMonth(jy, jm);
      const days = Array.from({ length: len }, (_, i) => i + 1);
      return {
        name: 'day',
        selectedIndex: Math.min(selectedDay, len) - 1,
        options: days.map((d) => ({ text: toFa(d), value: d })),
      };
    };

    const dayCol = makeDayCol(tempJ.jy, tempJ.jm, tempJ.jd);

    const picker = await this.pickerCtrl.create({
      columns: [dayCol, monthCol, yearCol],
      buttons: [
        { text: this.translation.translate('common.cancel'), role: 'cancel' },
        {
          text: this.translation.translate('reproductiveStatus.confirm'),
          handler: (value) => {
            const jd = value.day.value;
            const jm = value.month.value;
            const jy = value.year.value;
            this.periodDateIso = jalaliToIsoDate(jy, jm, jd);
            this.form.patchValue({ periodStartIso: this.periodDateIso });
            this.cdr.detectChanges();
          },
        },
      ],
    });

    await picker.present();
  }

  saveInfo() {
    this.validationMessage = '';

    const lastPeriodDate =
      this.form.get('periodStartIso')?.value || this.periodDateIso;
    const cycleLength = Number(this.durationDays);
    const averagePeriodDuration = Number(this.bleedingDays);

    if (!lastPeriodDate) {
      this.validationMessage = this.translation.translate(
        'reproductiveStatus.validationRequired',
      );
      return;
    }

    if (
      !Number.isFinite(cycleLength) ||
      cycleLength < 21 ||
      cycleLength > 60
    ) {
      this.validationMessage = this.translation.translate(
        'reproductiveStatus.validationRequired',
      );
      return;
    }

    if (
      !Number.isFinite(averagePeriodDuration) ||
      averagePeriodDuration < 2 ||
      averagePeriodDuration > 10
    ) {
      this.validationMessage = this.translation.translate(
        'reproductiveStatus.validationRequired',
      );
      return;
    }

    const result: CycleSetupSheetResult = {
      lastPeriodDate: String(lastPeriodDate).slice(0, 10),
      cycleLength,
      averagePeriodDuration,
    };

    this.modalCtrl.dismiss(result, 'confirm');
  }
}
