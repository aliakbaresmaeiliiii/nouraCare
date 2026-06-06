import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ModalController, PickerController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';
import { TranslationService } from '../../services/translation.service';
import { LanguageService } from '../../services/language.service';
import {
  formatJalaliFaFromIso,
  J_MONTHS,
  jalaliDaysInMonth,
  jalaliToIsoDate,
  toFa,
} from '../../utils/jalali-iranian-calendar.util';
import {
  formatHistoryDayDate,
  isPersianAppLanguage,
} from '../../utils/locale-date-format.util';
import { localCalendarIsoDate } from '../../utils/ion-datetime-today-highlight.util';
import {
  attachJalaliPickerLiveValidation,
  clearJalaliPickerFeedback,
  showJalaliPickerFeedback,
} from '../../utils/jalali-picker-live-validation.util';
import {
  helpKeyForValidationError,
  minCycleLastPeriodIso,
  validateCycleLastPeriodIso,
} from '../../utils/reproductive-date-validation.util';

export type MenopauseStage = 'perimenopause' | 'menopause';

export interface MenopauseSetupSheetResult {
  menopauseStage: MenopauseStage;
  lastPeriodDate?: string;
}

@Component({
  selector: 'app-menopause-setup-sheet',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './menopause-setup-sheet.component.html',
  styleUrls: ['./menopause-setup-sheet.component.scss'],
})
export class MenopauseSetupSheetComponent {
  private modalCtrl = inject(ModalController);
  private translation = inject(TranslationService);
  private languageService = inject(LanguageService);
  private pickerCtrl = inject(PickerController);
  private cdr = inject(ChangeDetectorRef);

  selectedStage: MenopauseStage = 'perimenopause';
  periodDateIso = '';
  isPeriodDateOpen = false;
  pickerValidationMessage = '';
  pickerValidationHelp = '';
  maxDate = localCalendarIsoDate();
  minPeriodDate = minCycleLastPeriodIso();

  selectStage(stage: MenopauseStage): void {
    this.selectedStage = stage;
    if (stage === 'menopause') {
      this.periodDateIso = '';
    }
  }

  get displayPeriodDate(): string {
    if (!this.periodDateIso) {
      return this.tr('menopauseSetup.chooseDate');
    }
    const lang = this.languageService.getCurrentLanguage();
    if (isPersianAppLanguage(lang)) {
      return formatJalaliFaFromIso(this.periodDateIso, 'DD MMMM YYYY');
    }
    const [y, m, d] = this.periodDateIso.split('-').map((n) => parseInt(n, 10));
    return formatHistoryDayDate(new Date(y, m - 1, d), lang);
  }

  get periodPickerRangeHint(): string {
    return this.translation.translateParams('reproductiveStatus.pickerPeriodRangeHint', {
      minDate: this.formatPeriodDisplayDate(this.minPeriodDate),
      maxDate: this.formatPeriodDisplayDate(this.maxDate),
    });
  }

  openPeriodDatePicker(): void {
    this.setPickerFeedback(null);
    if (isPersianAppLanguage(this.languageService.getCurrentLanguage())) {
      void this.openJalaliPicker();
      return;
    }
    this.isPeriodDateOpen = true;
  }

  closePeriodDate(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm') {
      if (!this.periodDateIso) {
        this.setPickerFeedback('reproductiveStatus.validationPeriodRequired');
        return;
      }
      const check = validateCycleLastPeriodIso(this.periodDateIso);
      if (!check.valid) {
        this.setPickerFeedback(check.errorKey);
        return;
      }
      this.periodDateIso = check.iso;
      this.setPickerFeedback(null);
    }
    this.isPeriodDateOpen = false;
  }

  onPeriodDateChange(event: CustomEvent): void {
    const value = (event.detail as { value?: string }).value as string;
    if (!value) {
      return;
    }
    this.periodDateIso = value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
    const check = validateCycleLastPeriodIso(this.periodDateIso);
    this.setPickerFeedback(check.valid ? null : check.errorKey);
    this.cdr.markForCheck();
  }

  onPeriodDateDismiss(): void {
    this.isPeriodDateOpen = false;
    this.setPickerFeedback(null);
  }

  async openJalaliPicker(): Promise<void> {
    const seedIso = this.periodDateIso || this.maxDate;
    const jalaali = await import('jalaali-js');
    const [gy, gm, gd] = seedIso.split('-').map((n) => parseInt(n, 10));
    const tempJ = jalaali.toJalaali(gy, gm, gd);

    const years = Array.from({ length: 60 }, (_, i) => 1360 + i);
    const yearCol = {
      name: 'year',
      selectedIndex: Math.max(0, years.indexOf(tempJ.jy)),
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
        { text: this.tr('common.cancel'), role: 'cancel' },
        {
          text: this.tr('reproductiveStatus.confirm'),
          handler: (value) => {
            const iso = jalaliToIsoDate(
              value.year.value,
              value.month.value,
              value.day.value,
            );
            const check = validateCycleLastPeriodIso(iso);
            if (!check.valid) {
              showJalaliPickerFeedback(picker, check.errorKey, (key) =>
                this.translation.translate(key),
              );
              this.cdr.detectChanges();
              return false;
            }
            clearJalaliPickerFeedback(picker);
            this.periodDateIso = check.iso;
            this.setPickerFeedback(null);
            this.cdr.detectChanges();
            return true;
          },
        },
      ],
    });

    await picker.present();

    attachJalaliPickerLiveValidation(picker, {
      validate: (iso) => validateCycleLastPeriodIso(iso),
      translate: (key) => this.translation.translate(key),
      rangeHint: this.periodPickerRangeHint,
    });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(): void {
    const result: MenopauseSetupSheetResult = {
      menopauseStage: this.selectedStage,
    };
    if (this.selectedStage === 'perimenopause' && this.periodDateIso.trim()) {
      const check = validateCycleLastPeriodIso(this.periodDateIso);
      if (!check.valid) {
        this.setPickerFeedback(check.errorKey);
        return;
      }
      result.lastPeriodDate = check.iso;
    }
    this.modalCtrl.dismiss(result, 'confirm');
  }

  tr(key: string): string {
    return this.translation.translate(key);
  }

  private formatPeriodDisplayDate(iso: string): string {
    const lang = this.languageService.getCurrentLanguage();
    if (isPersianAppLanguage(lang)) {
      return formatJalaliFaFromIso(iso, 'DD MMMM YYYY');
    }
    const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
    return formatHistoryDayDate(new Date(y, m - 1, d), lang);
  }

  private setPickerFeedback(errorKey: string | null): void {
    if (!errorKey) {
      this.pickerValidationMessage = '';
      this.pickerValidationHelp = '';
      return;
    }
    this.pickerValidationMessage = this.translation.translate(errorKey);
    const helpKey = helpKeyForValidationError(errorKey);
    this.pickerValidationHelp = helpKey ? this.translation.translate(helpKey) : '';
  }
}
