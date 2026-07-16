import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import * as jalaali from 'jalaali-js';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';
import {
  formatJalaliFaFromIso,
  J_MONTHS,
  jalaliDaysInMonth,
  jalaliToIsoDate,
} from '../../shared/utils/jalali-iranian-calendar.util';
import {
  formatLocalizedNumber,
  formatHistoryDayDate,
  isPersianAppLanguage,
} from '../../shared/utils/locale-date-format.util';
import { localCalendarIsoDate } from '../../shared/utils/ion-datetime-today-highlight.util';
import {
  helpKeyForValidationError,
  minCycleLastPeriodIso,
  validateBleedingDays,
  validateBleedingVsCycleLength,
  validateCycleLastPeriodIso,
  validateCycleLengthDays,
} from '../../shared/utils/reproductive-date-validation.util';
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
  private languageService = inject(LanguageService);
  private translation = inject(TranslationService);

  maxDate = localCalendarIsoDate();
  minPeriodDate = minCycleLastPeriodIso();
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
  validationHelp = '';
  pickerValidationMessage = '';
  pickerValidationHelp = '';
  submitAttempted = false;

  readonly jalaliPeriodMonths = J_MONTHS.map((label, idx) => ({
    label,
    value: idx + 1,
  }));
  readonly jalaliPeriodYears: number[] = (() => {
    const [minGy, minGm, minGd] = minCycleLastPeriodIso()
      .split('-')
      .map((n) => parseInt(n, 10));
    const [maxGy, maxGm, maxGd] = localCalendarIsoDate()
      .split('-')
      .map((n) => parseInt(n, 10));
    const minJ = jalaali.toJalaali(minGy, minGm, minGd);
    const maxJ = jalaali.toJalaali(maxGy, maxGm, maxGd);
    return Array.from({ length: maxJ.jy - minJ.jy + 1 }, (_, i) => minJ.jy + i);
  })();
  jalaliPeriodYear =
    this.jalaliPeriodYears[this.jalaliPeriodYears.length - 1] ?? 1400;
  jalaliPeriodMonth = 1;
  jalaliPeriodDay = 1;

  form = new FormGroup({
    durationDays: new FormControl(this.durationDays),
    bleedingDays: new FormControl(this.bleedingDays),
    periodStartIso: new FormControl(this.periodDateIso),
  });

  ngOnInit(): void {
    this.maxDate = localCalendarIsoDate();
    this.minPeriodDate = minCycleLastPeriodIso();
  }

  get canSubmit(): boolean {
    return this.getFormValidation().valid;
  }

  private getFormValidation():
    | { valid: true }
    | { valid: false; errorKey: string } {
    const periodIso = String(
      this.form.get('periodStartIso')?.value || this.periodDateIso || '',
    ).trim();
    if (!periodIso) {
      return { valid: false, errorKey: 'reproductiveStatus.validationPeriodRequired' };
    }
    const periodCheck = validateCycleLastPeriodIso(periodIso);
    if (!periodCheck.valid) {
      return periodCheck;
    }
    const cycleCheck = validateCycleLengthDays(this.durationDays);
    if (!cycleCheck.valid) {
      return cycleCheck;
    }
    const bleedCheck = validateBleedingDays(this.bleedingDays);
    if (!bleedCheck.valid) {
      return bleedCheck;
    }
    const vsCycle = validateBleedingVsCycleLength(
      this.bleedingDays,
      this.durationDays,
    );
    if (!vsCycle.valid) {
      return vsCycle;
    }
    return { valid: true };
  }

  get displayDurationDays(): string {
    return this.formatDays(this.durationDays);
  }

  get displayBleedingDays(): string {
    return this.formatDays(this.bleedingDays);
  }

  get displayPeriodPickerDays(): string {
    if (!this.periodDateIso) {
      return this.translation.translate('reproductiveStatus.chooseDate');
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

  periodFieldErrorKey(): string | null {
    if (!this.periodDateIso) {
      return null;
    }
    const check = validateCycleLastPeriodIso(this.periodDateIso);
    return check.valid ? null : check.errorKey;
  }

  isPeriodFieldInvalid(): boolean {
    return (
      !!this.periodFieldErrorKey() ||
      (this.submitAttempted && !this.periodDateIso)
    );
  }

  periodFieldError(): string {
    const key = this.periodFieldErrorKey();
    if (key) {
      return this.translation.translate(key);
    }
    if (this.submitAttempted && !this.periodDateIso) {
      return this.translation.translate('reproductiveStatus.validationPeriodRequired');
    }
    return '';
  }

  periodFieldHelp(): string {
    const key = this.periodFieldErrorKey();
    if (key) {
      return this.fieldHelpForError(key);
    }
    if (this.submitAttempted && !this.periodDateIso) {
      return this.translation.translate('reproductiveStatus.helpPeriodRequired');
    }
    return '';
  }

  private fieldHelpForError(errorKey: string | null): string {
    if (!errorKey) {
      return '';
    }
    const helpKey = helpKeyForValidationError(errorKey);
    return helpKey ? this.translation.translate(helpKey) : '';
  }

  private formatPeriodDisplayDate(iso: string): string {
    const lang = this.languageService.getCurrentLanguage();
    if (isPersianAppLanguage(lang)) {
      return formatJalaliFaFromIso(iso, 'DD MMMM YYYY');
    }
    const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
    return formatHistoryDayDate(new Date(y, m - 1, d), lang);
  }

  formatDays(value: number): string {
    const unit = this.translation.translate('reproductiveStatus.daysUnit');
    const num = formatLocalizedNumber(value, this.languageService.getCurrentLanguage());
    return `${num} ${unit}`;
  }

  get isPersianLanguage(): boolean {
    return isPersianAppLanguage(this.languageService.getCurrentLanguage());
  }

  get jalaliPeriodDayOptions(): number[] {
    const len = jalaliDaysInMonth(this.jalaliPeriodYear, this.jalaliPeriodMonth);
    return Array.from({ length: len }, (_, i) => i + 1);
  }

  openBleedingDaysPicker() {
    if (this.isBleedingDaysOpen) return;
    this.setPickerFeedback(null);
    this.tempBleedingDays = this.bleedingDays;
    this.isBleedingDaysOpen = true;
  }

  openDurationDaysPicker() {
    if (this.isDurationDaysOpen) return;
    this.setPickerFeedback(null);
    this.tempDurationDays = this.durationDays;
    this.isDurationDaysOpen = true;
  }

  openPeriodDatePicker() {
    this.setPickerFeedback(null);
    const seedIso = this.periodDateIso || this.maxDate;
    if (this.isPersianLanguage) {
      this.syncJalaliPeriodFromIso(seedIso);
    } else if (!this.periodDateIso) {
      this.periodDateIso = seedIso;
    }
    this.isPeriodDateOpen = true;
    this.validateActivePeriodPicker();
    this.cdr.markForCheck();
  }

  closeBleedingDays(role: 'cancel' | 'confirm') {
    if (role === 'confirm') {
      const bleedCheck = validateBleedingDays(this.tempBleedingDays);
      if (!bleedCheck.valid) {
        this.setPickerFeedback(bleedCheck.errorKey);
        return;
      }
      const vsCycle = validateBleedingVsCycleLength(
        this.tempBleedingDays,
        this.durationDays,
      );
      if (!vsCycle.valid) {
        this.setPickerFeedback(vsCycle.errorKey);
        return;
      }
      this.bleedingDays = Number(this.tempBleedingDays);
      this.form.patchValue({ bleedingDays: this.bleedingDays });
      this.setFormValidationFeedback(null);
    }
    this.setPickerFeedback(null);
    this.isBleedingDaysOpen = false;
  }

  closeDurationPicker(role: 'cancel' | 'confirm') {
    if (role === 'confirm') {
      const cycleCheck = validateCycleLengthDays(this.tempDurationDays);
      if (!cycleCheck.valid) {
        this.setPickerFeedback(cycleCheck.errorKey);
        return;
      }
      const vsCycle = validateBleedingVsCycleLength(
        this.bleedingDays,
        this.tempDurationDays,
      );
      if (!vsCycle.valid) {
        this.setPickerFeedback(vsCycle.errorKey);
        return;
      }
      this.durationDays = Number(this.tempDurationDays);
      this.form.patchValue({ durationDays: this.durationDays });
      this.setFormValidationFeedback(null);
    }
    this.setPickerFeedback(null);
    this.isDurationDaysOpen = false;
  }

  closePeriodDate(role: 'cancel' | 'confirm') {
    if (role === 'confirm') {
      const check = this.isPersianLanguage
        ? validateCycleLastPeriodIso(
            jalaliToIsoDate(
              this.jalaliPeriodYear,
              this.jalaliPeriodMonth,
              this.jalaliPeriodDay,
            ),
          )
        : validateCycleLastPeriodIso(this.periodDateIso);
      if (!check.valid) {
        this.setPickerFeedback(check.errorKey);
        return;
      }
      this.periodDateIso = check.iso;
      this.periodDate = this.periodDateIso;
      this.form.patchValue({ periodStartIso: this.periodDateIso });
      this.setFormValidationFeedback(null);
    }
    this.setPickerFeedback(null);
    this.isPeriodDateOpen = false;
  }

  onDurationDaysChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value != null) {
      this.tempDurationDays = Number(value);
      this.form.get('durationDays')?.patchValue(value);
      const cycleCheck = validateCycleLengthDays(this.tempDurationDays);
      if (!cycleCheck.valid) {
        this.setPickerFeedback(cycleCheck.errorKey);
        return;
      }
      const vsCycle = validateBleedingVsCycleLength(
        this.bleedingDays,
        this.tempDurationDays,
      );
      this.setPickerFeedback(vsCycle.valid ? null : vsCycle.errorKey);
    }
  }

  onBleedingDaysChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value != null) {
      this.tempBleedingDays = Number(value);
      this.form.get('bleedingDays')?.patchValue(value);
      const bleedCheck = validateBleedingDays(this.tempBleedingDays);
      if (!bleedCheck.valid) {
        this.setPickerFeedback(bleedCheck.errorKey);
        return;
      }
      const vsCycle = validateBleedingVsCycleLength(
        this.tempBleedingDays,
        this.durationDays,
      );
      this.setPickerFeedback(vsCycle.valid ? null : vsCycle.errorKey);
    }
  }

  onPeriodDateChange(event: CustomEvent) {
    const value = (event.detail as { value?: string }).value as string;
    if (!value) return;
    this.periodDateIso = value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
    this.periodDate = this.periodDateIso;
    this.form.get('periodStartIso')?.patchValue(this.periodDateIso);
    const check = validateCycleLastPeriodIso(this.periodDateIso);
    this.setPickerFeedback(check.valid ? null : check.errorKey);
    this.cdr.markForCheck();
  }

  onJalaliPeriodColumnChange(
    event: CustomEvent,
    column: 'day' | 'month' | 'year',
  ): void {
    const value = Number((event.detail as { value?: number | string }).value);
    if (!Number.isFinite(value)) return;
    if (column === 'year') {
      this.jalaliPeriodYear = value;
    } else if (column === 'month') {
      this.jalaliPeriodMonth = value;
    } else {
      this.jalaliPeriodDay = value;
    }
    const maxDay = jalaliDaysInMonth(this.jalaliPeriodYear, this.jalaliPeriodMonth);
    if (this.jalaliPeriodDay > maxDay) {
      this.jalaliPeriodDay = maxDay;
    }
    this.validateActivePeriodPicker();
    this.cdr.markForCheck();
  }

  onPeriodDateDismiss() {
    this.isPeriodDateOpen = false;
    this.setPickerFeedback(null);
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  saveInfo() {
    this.submitAttempted = true;
    this.setFormValidationFeedback(null);

    const formCheck = this.getFormValidation();
    if (!formCheck.valid) {
      this.setFormValidationFeedback(formCheck.errorKey);
      return;
    }

    const periodCheck = validateCycleLastPeriodIso(
      String(this.form.get('periodStartIso')?.value || this.periodDateIso),
    );
    if (!periodCheck.valid) {
      this.setFormValidationFeedback(periodCheck.errorKey);
      return;
    }

    const cycleLength = Number(this.durationDays);
    const averagePeriodDuration = Number(this.bleedingDays);

    const result: CycleSetupSheetResult = {
      lastPeriodDate: periodCheck.iso,
      cycleLength,
      averagePeriodDuration,
    };

    this.modalCtrl.dismiss(result, 'confirm');
  }

  private syncJalaliPeriodFromIso(iso: string): void {
    const [gy, gm, gd] = iso.split('-').map((n) => parseInt(n, 10));
    const j = jalaali.toJalaali(gy, gm, gd);
    this.jalaliPeriodYear = this.jalaliPeriodYears.includes(j.jy)
      ? j.jy
      : (this.jalaliPeriodYears[this.jalaliPeriodYears.length - 1] ?? j.jy);
    this.jalaliPeriodMonth = j.jm;
    this.jalaliPeriodDay = j.jd;
    const maxDay = jalaliDaysInMonth(this.jalaliPeriodYear, this.jalaliPeriodMonth);
    if (this.jalaliPeriodDay > maxDay) {
      this.jalaliPeriodDay = maxDay;
    }
  }

  private validateActivePeriodPicker(): void {
    const check = this.isPersianLanguage
      ? validateCycleLastPeriodIso(
          jalaliToIsoDate(
            this.jalaliPeriodYear,
            this.jalaliPeriodMonth,
            this.jalaliPeriodDay,
          ),
        )
      : validateCycleLastPeriodIso(this.periodDateIso);
    this.setPickerFeedback(check.valid ? null : check.errorKey);
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

  private setFormValidationFeedback(errorKey: string | null): void {
    if (!errorKey) {
      this.validationMessage = '';
      this.validationHelp = '';
      return;
    }
    this.validationMessage = this.translation.translate(errorKey);
    const helpKey = helpKeyForValidationError(errorKey);
    this.validationHelp = helpKey ? this.translation.translate(helpKey) : '';
  }
}
