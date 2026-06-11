import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ModalController, PickerController } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';
import type { InitializeReproductiveStateDto } from '../../services/onboarding.service';
import { CycleSettingsService } from '../../services/cycle-settings.service';
import { TranslationService } from '../../services/translation.service';
import { LanguageService } from '../../services/language.service';
import {
  buildCycleLmpDatetimeHighlights,
  ionDatetimeTodayHighlight,
  localCalendarIsoDate,
} from '../../utils/ion-datetime-today-highlight.util';
import {
  lmpIsoFromDueIso,
  normalizeLmpInput,
  pregnancyMetricsFromLmpIso,
} from '../../utils/pregnancy-lmp.util';
import {
  attachJalaliPickerLiveValidation,
  clearJalaliPickerFeedback,
  showJalaliPickerFeedback,
} from '../../utils/jalali-picker-live-validation.util';
import {
  helpKeyForValidationError,
  maxPregnancyDueIso,
  minPregnancyLmpIso,
  type ReproductiveDateValidationResult,
  validateGestationalWeekAndDay,
  validatePregnancyDueIso,
  validatePregnancyLmpIso,
} from '../../utils/reproductive-date-validation.util';
import {
  formatJalaliFaFromIso,
  J_MONTHS,
  JALALI_DATE_PICKER_CLASS,
  JALALI_PICKER_MONTH_COL_WIDTH,
  jalaliDaysInMonth,
  jalaliToIsoDate,
  toFa,
} from '../../utils/jalali-iranian-calendar.util';
import {
  formatLocalizedNumber,
  formatHistoryDayDate,
  isPersianAppLanguage,
} from '../../utils/locale-date-format.util';

export type PregnancyDateMethod = 'due' | 'lmp' | 'gestational';

@Component({
  selector: 'app-pregnancy-setup-sheet',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './pregnancy-setup-sheet.component.html',
  styleUrls: ['./pregnancy-setup-sheet.component.scss'],
})
export class PregnancySetupSheetComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private pickerCtrl = inject(PickerController);
  private cdr = inject(ChangeDetectorRef);
  private cycleSettings = inject(CycleSettingsService);
  private translation = inject(TranslationService);
  private languageService = inject(LanguageService);

  readonly todayStr = localCalendarIsoDate();
  readonly minLmpIso = minPregnancyLmpIso();
  readonly maxDueIso = maxPregnancyDueIso();
  readonly datetimeHighlightedToday = ionDatetimeTodayHighlight();
  readonly gestationalWeekNumbers = Array.from({ length: 42 }, (_, i) => i + 1);
  readonly gestationalDayNumbers = Array.from({ length: 7 }, (_, i) => i);

  activeMethod: PregnancyDateMethod = 'due';
  validationMessage = '';
  validationHelp = '';
  pickerValidationMessage = '';
  pickerValidationHelp = '';
  submitAttempted = false;

  dueIso = '';
  lmpIso = '';
  gestationalWeek = 12;
  gestationalDay = 0;
  tempGestationalWeek = 12;
  tempGestationalDay = 0;

  isDueDateOpen = false;
  isLmpDateOpen = false;
  isGestationalWeekOpen = false;
  isGestationalDayOpen = false;

  private jalaliTarget: 'due' | 'lmp' | null = null;

  form = new FormGroup({
    childName: new FormControl(''),
  });

  ngOnInit(): void {
    const storedName = this.cycleSettings.babyName();
    if (storedName) {
      this.form.patchValue({ childName: storedName });
    }
  }

  get lmpDatetimeHighlights() {
    return buildCycleLmpDatetimeHighlights(
      normalizeLmpInput(this.lmpIso),
      this.cycleSettings.cycleLength() || 28,
      this.cycleSettings.periodLength() || 5,
    );
  }

  get displayDueDate(): string {
    return this.formatDisplayDate(this.dueIso);
  }

  get displayLmpDate(): string {
    return this.formatDisplayDate(this.lmpIso);
  }

  get displayGestationalWeek(): string {
    const unit = this.translation.translate('pregnancySetup.weekUnit');
    const num = formatLocalizedNumber(
      this.gestationalWeek,
      this.languageService.getCurrentLanguage(),
    );
    return `${num} ${unit}`;
  }

  get displayGestationalDay(): string {
    const unit = this.translation.translate('pregnancySetup.dayUnit');
    const num = formatLocalizedNumber(
      this.gestationalDay,
      this.languageService.getCurrentLanguage(),
    );
    return `${num} ${unit}`;
  }

  get defaultLmpPreviewIso(): string {
    return this.lmpIso || this.defaultLmpIso();
  }

  selectMethod(method: PregnancyDateMethod): void {
    this.activeMethod = method;
    this.validationMessage = '';
    this.submitAttempted = false;
  }

  get canSubmit(): boolean {
    return this.getActiveMethodValidation().valid;
  }

  get gestationalAgePreview(): string {
    const lang = this.languageService.getCurrentLanguage();
    if (this.activeMethod === 'gestational') {
      const check = validateGestationalWeekAndDay(
        this.gestationalWeek,
        this.gestationalDay,
      );
      if (!check.valid) {
        return '';
      }
      const weekNum = formatLocalizedNumber(this.gestationalWeek, lang);
      if (this.gestationalDay > 0) {
        const dayNum = formatLocalizedNumber(this.gestationalDay, lang);
        return this.translation.translateParams('pregnancySetup.agePreviewWithDay', {
          week: weekNum,
          day: dayNum,
        });
      }
      return this.translation.translateParams('pregnancySetup.agePreview', {
        week: weekNum,
      });
    }

    const lmpIso = this.resolveLmpIsoForPreview();
    if (!lmpIso) {
      return '';
    }
    const metrics = pregnancyMetricsFromLmpIso(lmpIso);
    if (!metrics) {
      return '';
    }
    const weekNum = formatLocalizedNumber(metrics.week, lang);
    if (metrics.day > 0) {
      const dayNum = formatLocalizedNumber(metrics.day, lang);
      return this.translation.translateParams('pregnancySetup.agePreviewWithDay', {
        week: weekNum,
        day: dayNum,
      });
    }
    return this.translation.translateParams('pregnancySetup.agePreview', {
      week: weekNum,
    });
  }

  get pickerGestationalPreview(): string {
    const lang = this.languageService.getCurrentLanguage();
    const week = this.isGestationalWeekOpen
      ? this.tempGestationalWeek
      : this.gestationalWeek;
    const day = this.isGestationalDayOpen
      ? this.tempGestationalDay
      : this.gestationalDay;
    const check = validateGestationalWeekAndDay(week, day);
    if (!check.valid) {
      return '';
    }
    const weekNum = formatLocalizedNumber(week, lang);
    if (day > 0) {
      const dayNum = formatLocalizedNumber(day, lang);
      return this.translation.translateParams('pregnancySetup.agePreviewWithDay', {
        week: weekNum,
        day: dayNum,
      });
    }
    return this.translation.translateParams('pregnancySetup.agePreview', {
      week: weekNum,
    });
  }

  activeMethodFieldError(): string {
    const check = this.getActiveMethodValidation();
    return check.valid ? '' : this.translation.translate(check.errorKey);
  }

  activeMethodFieldHelp(): string {
    const check = this.getActiveMethodValidation();
    if (check.valid) {
      return '';
    }
    const helpKey = helpKeyForValidationError(check.errorKey);
    return helpKey ? this.translation.translate(helpKey) : '';
  }

  dueFieldErrorKey(): string | null {
    if (!this.dueIso) {
      return null;
    }
    const check = validatePregnancyDueIso(this.dueIso);
    return check.valid ? null : check.errorKey;
  }

  lmpFieldErrorKey(): string | null {
    if (!this.lmpIso) {
      return null;
    }
    const check = validatePregnancyLmpIso(this.lmpIso);
    return check.valid ? null : check.errorKey;
  }

  gestationalFieldErrorKey(): string | null {
    const check = validateGestationalWeekAndDay(
      this.gestationalWeek,
      this.gestationalDay,
    );
    return check.valid ? null : check.errorKey;
  }

  fieldHelpForError(errorKey: string | null): string {
    if (!errorKey) {
      return '';
    }
    const helpKey = helpKeyForValidationError(errorKey);
    return helpKey ? this.translation.translate(helpKey) : '';
  }

  showDueFieldIssue(): boolean {
    return this.activeMethod === 'due' && !!this.dueFieldErrorKey();
  }

  showLmpFieldIssue(): boolean {
    return this.activeMethod === 'lmp' && !!this.lmpFieldErrorKey();
  }

  showGestationalFieldIssue(): boolean {
    return (
      this.activeMethod === 'gestational' && !!this.gestationalFieldErrorKey()
    );
  }

  isDueFieldInvalid(): boolean {
    return this.showDueFieldIssue() || (this.submitAttempted && this.isMethodActive('due') && !this.getActiveMethodValidation().valid);
  }

  isLmpFieldInvalid(): boolean {
    return this.showLmpFieldIssue() || (this.submitAttempted && this.isMethodActive('lmp') && !this.getActiveMethodValidation().valid);
  }

  isGestationalGroupInvalid(): boolean {
    return (
      this.showGestationalFieldIssue() ||
      (this.submitAttempted &&
        this.isMethodActive('gestational') &&
        !this.getActiveMethodValidation().valid)
    );
  }

  get duePickerRangeHint(): string {
    return this.translation.translateParams('pregnancySetup.pickerDueRangeHint', {
      minDate: this.formatDisplayDate(this.todayStr),
      maxDate: this.formatDisplayDate(this.maxDueIso),
    });
  }

  get lmpPickerRangeHint(): string {
    return this.translation.translateParams('pregnancySetup.pickerLmpRangeHint', {
      minDate: this.formatDisplayDate(this.minLmpIso),
      maxDate: this.formatDisplayDate(this.todayStr),
    });
  }

  dueFieldError(): string {
    const key = this.dueFieldErrorKey();
    if (key) {
      return this.translation.translate(key);
    }
    if (this.submitAttempted && this.isMethodActive('due')) {
      return this.activeMethodFieldError();
    }
    return '';
  }

  dueFieldHelp(): string {
    const key = this.dueFieldErrorKey();
    if (key) {
      return this.fieldHelpForError(key);
    }
    if (this.submitAttempted && this.isMethodActive('due')) {
      return this.activeMethodFieldHelp();
    }
    return '';
  }

  lmpFieldError(): string {
    const key = this.lmpFieldErrorKey();
    if (key) {
      return this.translation.translate(key);
    }
    if (this.submitAttempted && this.isMethodActive('lmp')) {
      return this.activeMethodFieldError();
    }
    return '';
  }

  lmpFieldHelp(): string {
    const key = this.lmpFieldErrorKey();
    if (key) {
      return this.fieldHelpForError(key);
    }
    if (this.submitAttempted && this.isMethodActive('lmp')) {
      return this.activeMethodFieldHelp();
    }
    return '';
  }

  gestationalFieldError(): string {
    const key = this.gestationalFieldErrorKey();
    if (key) {
      return this.translation.translate(key);
    }
    if (this.submitAttempted && this.isMethodActive('gestational')) {
      return this.activeMethodFieldError();
    }
    return '';
  }

  gestationalFieldHelp(): string {
    const key = this.gestationalFieldErrorKey();
    if (key) {
      return this.fieldHelpForError(key);
    }
    if (this.submitAttempted && this.isMethodActive('gestational')) {
      return this.activeMethodFieldHelp();
    }
    return '';
  }

  isMethodActive(method: PregnancyDateMethod): boolean {
    return this.activeMethod === method;
  }

  cancel(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  openDueDatePicker(): void {
    this.selectMethod('due');
    this.setPickerFeedback(null);
    if (isPersianAppLanguage(this.languageService.getCurrentLanguage())) {
      this.jalaliTarget = 'due';
      void this.openJalaliPicker(this.dueIso || this.todayStr);
      return;
    }
    this.isDueDateOpen = true;
  }

  openLmpDatePicker(): void {
    this.selectMethod('lmp');
    this.setPickerFeedback(null);
    if (isPersianAppLanguage(this.languageService.getCurrentLanguage())) {
      this.jalaliTarget = 'lmp';
      const fallback = this.lmpIso || this.defaultLmpIso();
      void this.openJalaliPicker(fallback);
      return;
    }
    this.isLmpDateOpen = true;
  }

  openGestationalWeekPicker(): void {
    this.selectMethod('gestational');
    this.setPickerFeedback(null);
    this.tempGestationalWeek = this.gestationalWeek;
    this.isGestationalWeekOpen = true;
  }

  openGestationalDayPicker(): void {
    this.selectMethod('gestational');
    this.setPickerFeedback(null);
    this.tempGestationalDay = this.gestationalDay;
    this.isGestationalDayOpen = true;
  }

  closeDueDate(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm') {
      const check = validatePregnancyDueIso(this.dueIso);
      if (!check.valid) {
        this.setPickerFeedback(check.errorKey);
        return;
      }
      this.dueIso = check.iso;
      this.selectMethod('due');
      this.setFormValidationFeedback(null);
    }
    this.setPickerFeedback(null);
    this.isDueDateOpen = false;
  }

  closeLmpDate(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm') {
      const check = validatePregnancyLmpIso(this.lmpIso);
      if (!check.valid) {
        this.setPickerFeedback(check.errorKey);
        return;
      }
      this.lmpIso = check.iso;
      this.selectMethod('lmp');
      this.setFormValidationFeedback(null);
    }
    this.setPickerFeedback(null);
    this.isLmpDateOpen = false;
  }

  closeGestationalWeek(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm') {
      const check = validateGestationalWeekAndDay(
        this.tempGestationalWeek,
        this.gestationalDay,
      );
      if (!check.valid) {
        this.setPickerFeedback(check.errorKey);
        return;
      }
      this.gestationalWeek = Number(this.tempGestationalWeek);
      this.selectMethod('gestational');
      this.setFormValidationFeedback(null);
    }
    this.setPickerFeedback(null);
    this.isGestationalWeekOpen = false;
  }

  closeGestationalDay(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm') {
      const check = validateGestationalWeekAndDay(
        this.gestationalWeek,
        this.tempGestationalDay,
      );
      if (!check.valid) {
        this.setPickerFeedback(check.errorKey);
        return;
      }
      this.gestationalDay = Number(this.tempGestationalDay);
      this.selectMethod('gestational');
      this.setFormValidationFeedback(null);
    }
    this.setPickerFeedback(null);
    this.isGestationalDayOpen = false;
  }

  onDueDateChange(event: CustomEvent): void {
    this.dueIso = this.extractIsoFromDatetimeEvent(event);
    if (!this.dueIso) {
      this.setPickerFeedback(null);
    } else {
      const check = validatePregnancyDueIso(this.dueIso);
      this.setPickerFeedback(check.valid ? null : check.errorKey);
    }
    this.cdr.markForCheck();
  }

  onLmpDateChange(event: CustomEvent): void {
    this.lmpIso = this.extractIsoFromDatetimeEvent(event);
    if (!this.lmpIso) {
      this.setPickerFeedback(null);
    } else {
      const check = validatePregnancyLmpIso(this.lmpIso);
      this.setPickerFeedback(check.valid ? null : check.errorKey);
    }
    this.cdr.markForCheck();
  }

  getDuePickerPreview(): string {
    if (!this.dueIso) {
      return '';
    }
    const lmp = lmpIsoFromDueIso(this.dueIso);
    return lmp ? this.previewFromLmpIso(lmp) : '';
  }

  getLmpPickerPreview(): string {
    return this.lmpIso ? this.previewFromLmpIso(this.lmpIso) : '';
  }

  onGestationalWeekChange(event: CustomEvent): void {
    const value = event.detail.value;
    if (value != null) {
      this.tempGestationalWeek = Number(value);
      const check = validateGestationalWeekAndDay(
        this.tempGestationalWeek,
        this.gestationalDay,
      );
      this.setPickerFeedback(check.valid ? null : check.errorKey);
      this.cdr.markForCheck();
    }
  }

  onGestationalDayChange(event: CustomEvent): void {
    const value = event.detail.value;
    if (value != null) {
      this.tempGestationalDay = Number(value);
      const check = validateGestationalWeekAndDay(
        this.gestationalWeek,
        this.tempGestationalDay,
      );
      this.setPickerFeedback(check.valid ? null : check.errorKey);
      this.cdr.markForCheck();
    }
  }

  submit(): void {
    this.submitAttempted = true;
    this.setFormValidationFeedback(null);
    const childName = String(this.form.get('childName')?.value ?? '').trim();
    if (childName) {
      this.cycleSettings.setBabyName(childName);
    }

    const check = this.getActiveMethodValidation();
    if (!check.valid) {
      this.setFormValidationFeedback(check.errorKey);
      this.cdr.markForCheck();
      return;
    }

    if (this.activeMethod === 'lmp' || this.activeMethod === 'gestational') {
      void this.modalCtrl.dismiss(
        {
          state: 'pregnant',
          pregnancyStartDate: check.iso,
        } satisfies InitializeReproductiveStateDto,
        'confirm',
      );
      return;
    }

    void this.modalCtrl.dismiss(
      {
        state: 'pregnant',
        pregnancyDueDate: check.iso,
      } satisfies InitializeReproductiveStateDto,
      'confirm',
    );
  }

  private getActiveMethodValidation(): ReproductiveDateValidationResult {
    if (this.activeMethod === 'lmp') {
      if (!this.lmpIso) {
        return { valid: false, errorKey: 'pregnancySetup.validationLmpRequired' };
      }
      return validatePregnancyLmpIso(this.lmpIso);
    }
    if (this.activeMethod === 'gestational') {
      return validateGestationalWeekAndDay(
        this.gestationalWeek,
        this.gestationalDay,
      );
    }
    if (!this.dueIso) {
      return { valid: false, errorKey: 'pregnancySetup.validationDueRequired' };
    }
    return validatePregnancyDueIso(this.dueIso);
  }

  private resolveLmpIsoForPreview(): string | null {
    if (this.activeMethod === 'lmp') {
      const check = validatePregnancyLmpIso(this.lmpIso);
      return check.valid ? check.iso : null;
    }
    if (this.activeMethod === 'due') {
      if (!this.dueIso) {
        return null;
      }
      const dueCheck = validatePregnancyDueIso(this.dueIso);
      if (!dueCheck.valid) {
        return null;
      }
      return lmpIsoFromDueIso(dueCheck.iso);
    }
    return null;
  }

  private previewFromLmpIso(lmpIso: string): string {
    const metrics = pregnancyMetricsFromLmpIso(lmpIso);
    if (!metrics) {
      return '';
    }
    const lang = this.languageService.getCurrentLanguage();
    const weekNum = formatLocalizedNumber(metrics.week, lang);
    if (metrics.day > 0) {
      const dayNum = formatLocalizedNumber(metrics.day, lang);
      return this.translation.translateParams('pregnancySetup.agePreviewWithDay', {
        week: weekNum,
        day: dayNum,
      });
    }
    return this.translation.translateParams('pregnancySetup.agePreview', {
      week: weekNum,
    });
  }

  private defaultLmpIso(): string {
    const d = new Date();
    d.setDate(d.getDate() - 84);
    return localCalendarIsoDate(d);
  }

  private extractIsoFromDatetimeEvent(event: CustomEvent): string {
    const value = (event.detail as { value?: string }).value as string;
    if (!value) return '';
    return value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
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

  private formatDisplayDate(iso: string): string {
    if (!iso) {
      return this.translation.translate('pregnancySetup.chooseDate');
    }
    const lang = this.languageService.getCurrentLanguage();
    if (isPersianAppLanguage(lang)) {
      return formatJalaliFaFromIso(iso, 'DD MMMM YYYY');
    }
    const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
    return formatHistoryDayDate(new Date(y, m - 1, d), lang);
  }

  private async openJalaliPicker(initialIso: string): Promise<void> {
    const jalaali = await import('jalaali-js');
    const [y, m, d] = initialIso.split('-').map((n) => parseInt(n, 10));
    const initial = jalaali.toJalaali(y, m, d);

    const years = Array.from({ length: 60 }, (_, i) => 1360 + i);
    const yearCol = {
      name: 'year',
      selectedIndex: Math.max(0, years.indexOf(initial.jy)),
      options: years.map((yr) => ({ text: toFa(yr), value: yr })),
    };

    const monthCol = {
      name: 'month',
      selectedIndex: initial.jm - 1,
      columnWidth: JALALI_PICKER_MONTH_COL_WIDTH,
      optionsWidth: JALALI_PICKER_MONTH_COL_WIDTH,
      options: J_MONTHS.map((mo, idx) => ({ text: mo, value: idx + 1 })),
    };

    const makeDayCol = (jy: number, jm: number, selectedDay = 1) => {
      const len = jalaliDaysInMonth(jy, jm);
      const days = Array.from({ length: len }, (_, i) => i + 1);
      return {
        name: 'day',
        selectedIndex: Math.min(selectedDay, len) - 1,
        options: days.map((day) => ({ text: toFa(day), value: day })),
      };
    };

    const dayCol = makeDayCol(initial.jy, initial.jm, initial.jd);
    const target = this.jalaliTarget;
    const rangeHint =
      target === 'due' ? this.duePickerRangeHint : this.lmpPickerRangeHint;

    const picker = await this.pickerCtrl.create({
      cssClass: JALALI_DATE_PICKER_CLASS,
      columns: [dayCol, monthCol, yearCol],
      buttons: [
        { text: this.translation.translate('common.cancel'), role: 'cancel' },
        {
          text: this.translation.translate('reproductiveStatus.confirm'),
          handler: (value) => {
            const iso = jalaliToIsoDate(
              value.year.value,
              value.month.value,
              value.day.value,
            );
            const check =
              target === 'due'
                ? validatePregnancyDueIso(iso)
                : validatePregnancyLmpIso(iso);
            if (!check.valid) {
              showJalaliPickerFeedback(picker, check.errorKey, (key) =>
                this.translation.translate(key),
              );
              this.cdr.detectChanges();
              return false;
            }
            clearJalaliPickerFeedback(picker);
            if (target === 'due') {
              this.dueIso = check.iso;
            } else if (target === 'lmp') {
              this.lmpIso = check.iso;
            }
            this.setFormValidationFeedback(null);
            this.jalaliTarget = null;
            this.cdr.detectChanges();
            return true;
          },
        },
      ],
    });

    await picker.present();

    attachJalaliPickerLiveValidation(picker, {
      validate: (iso) =>
        target === 'due'
          ? validatePregnancyDueIso(iso)
          : validatePregnancyLmpIso(iso),
      translate: (key) => this.translation.translate(key),
      rangeHint,
    });
  }
}
