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
  isCalendarDateNotAfterToday,
  lmpIsoFromGestationalWeekAndDay,
  normalizeLmpInput,
} from '../../utils/pregnancy-lmp.util';
import {
  formatJalaliFaFromIso,
  J_MONTHS,
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
  readonly datetimeHighlightedToday = ionDatetimeTodayHighlight();
  readonly gestationalWeekNumbers = Array.from({ length: 42 }, (_, i) => i + 1);
  readonly gestationalDayNumbers = Array.from({ length: 7 }, (_, i) => i);

  activeMethod: PregnancyDateMethod = 'due';
  validationMessage = '';

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

  /** Which Jalali picker is active when using Persian calendar. */
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

  selectMethod(method: PregnancyDateMethod): void {
    this.activeMethod = method;
    this.validationMessage = '';
  }

  isMethodActive(method: PregnancyDateMethod): boolean {
    return this.activeMethod === method;
  }

  cancel(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  openDueDatePicker(): void {
    this.selectMethod('due');
    if (isPersianAppLanguage(this.languageService.getCurrentLanguage())) {
      this.jalaliTarget = 'due';
      void this.openJalaliPicker(this.dueIso || this.todayStr);
      return;
    }
    this.isDueDateOpen = true;
  }

  openLmpDatePicker(): void {
    this.selectMethod('lmp');
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
    this.tempGestationalWeek = this.gestationalWeek;
    this.isGestationalWeekOpen = true;
  }

  openGestationalDayPicker(): void {
    this.selectMethod('gestational');
    this.tempGestationalDay = this.gestationalDay;
    this.isGestationalDayOpen = true;
  }

  closeDueDate(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm' && this.dueIso) {
      this.selectMethod('due');
    }
    this.isDueDateOpen = false;
  }

  closeLmpDate(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm' && this.lmpIso) {
      this.selectMethod('lmp');
    }
    this.isLmpDateOpen = false;
  }

  closeGestationalWeek(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm') {
      this.gestationalWeek = Number(this.tempGestationalWeek);
      this.selectMethod('gestational');
    }
    this.isGestationalWeekOpen = false;
  }

  closeGestationalDay(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm') {
      this.gestationalDay = Number(this.tempGestationalDay);
      this.selectMethod('gestational');
    }
    this.isGestationalDayOpen = false;
  }

  onDueDateChange(event: CustomEvent): void {
    this.dueIso = this.extractIsoFromDatetimeEvent(event);
  }

  onLmpDateChange(event: CustomEvent): void {
    this.lmpIso = this.extractIsoFromDatetimeEvent(event);
  }

  onGestationalWeekChange(event: CustomEvent): void {
    const value = event.detail.value;
    if (value != null) {
      this.tempGestationalWeek = Number(value);
    }
  }

  onGestationalDayChange(event: CustomEvent): void {
    const value = event.detail.value;
    if (value != null) {
      this.tempGestationalDay = Number(value);
    }
  }

  submit(): void {
    this.validationMessage = '';
    const childName = String(this.form.get('childName')?.value ?? '').trim();
    if (childName) {
      this.cycleSettings.setBabyName(childName);
    }

    const todayStr = localCalendarIsoDate();

    if (this.activeMethod === 'lmp') {
      const raw = (this.lmpIso || '').trim();
      if (!raw) {
        this.validationMessage = this.translation.translate(
          'pregnancySetup.validationLmpRequired',
        );
        return;
      }
      const day = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10);
      if (day > todayStr) {
        this.validationMessage = this.translation.translate(
          'pregnancySetup.validationLmpFuture',
        );
        return;
      }
      const patch: InitializeReproductiveStateDto = {
        state: 'pregnant',
        pregnancyStartDate: day,
      };
      void this.modalCtrl.dismiss(patch, 'confirm');
      return;
    }

    if (this.activeMethod === 'gestational') {
      const lmp = lmpIsoFromGestationalWeekAndDay(
        this.gestationalWeek,
        this.gestationalDay,
      );
      if (!lmp || !isCalendarDateNotAfterToday(lmp)) {
        this.validationMessage = this.translation.translate(
          'pregnancySetup.validationGestationalInvalid',
        );
        return;
      }
      const patch: InitializeReproductiveStateDto = {
        state: 'pregnant',
        pregnancyStartDate: lmp,
      };
      void this.modalCtrl.dismiss(patch, 'confirm');
      return;
    }

    const due = (this.dueIso || '').trim();
    if (!due) {
      this.validationMessage = this.translation.translate(
        'pregnancySetup.validationDueRequired',
      );
      return;
    }
    const dueDay = due.includes('T') ? due.split('T')[0] : due.slice(0, 10);
    if (dueDay < todayStr) {
      this.validationMessage = this.translation.translate(
        'pregnancySetup.validationDuePast',
      );
      return;
    }
    const patch: InitializeReproductiveStateDto = {
      state: 'pregnant',
      pregnancyDueDate: dueDay,
    };
    void this.modalCtrl.dismiss(patch, 'confirm');
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

    const picker = await this.pickerCtrl.create({
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
            if (target === 'due') {
              this.dueIso = iso;
            } else if (target === 'lmp') {
              this.lmpIso = iso;
            }
            this.jalaliTarget = null;
            this.cdr.detectChanges();
          },
        },
      ],
    });

    await picker.present();
  }
}
