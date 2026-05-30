import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { IonInput, ModalController, PickerController } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';
import {
  formatJalaliFaFromIso,
  J_MONTHS,
  jalaliDaysInMonth,
  jalaliToIsoDate,
  toFa,
} from '../../shared/utils/jalali-iranian-calendar.util';

interface pregnancyForm {
  pregnancyEndDate: string;
  notes: string;
}
@Component({
  selector: 'app-reproductive-status',
  templateUrl: './reproductive-status.component.html',
  styleUrls: ['./reproductive-status.component.scss'],
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class ReproductiveStatusComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  maxDate = new Date().toISOString().split('T')[0];
  @ViewChild('ionInputEl', { static: true }) ionInputEl!: IonInput;
  @Input() title: string = '';
  @Input() subTitle: string = '';
  @ViewChild('bleedingInput') bleedingInput!: IonInput;
  @ViewChild('durationInput') durationInput!: IonInput;
  currentValue = 22;
  isPickerOpen = false;
  durationDaysNumber = Array.from({ length: 41 }, (_, i) => i + 20);
  bleedingDaysNumbers = Array.from({ length: 8 }, (_, i) => i + 3);
  tempPeriodDuration = 28;
  isBleedingDaysOpen = false;
  isDurationDaysOpen = false;
  bleedingDays = 5;
  durationDays = 22;
  tempBleedingDays = 5;
  tempDurationDays = 22;

  periodDate = '';
  isPeriodDateOpen = false;
  periodDateIso = '';

  get displayDurationDays(): string {
    return `${this.toPersianNumber(this.durationDays)} روز`;
  }
  get displayBleedingDays(): string {
    return `${this.toPersianNumber(this.bleedingDays)} روز`;
  }

  get displayPeriodPickerDays() {
    return this.periodDateIso
      ? formatJalaliFaFromIso(this.periodDateIso, 'DD MMMM YYYY')
      : '';
  }

  constructor(private pickerCtrl: PickerController) {}

  ngOnInit(): void {
    this.maxDate = new Date().toISOString().split('T')[0];
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
  // openLastPeriodPicker() {
  //   if (this.isPeriodDateOpen) return;
  //   this.tempPeriodDate = this.periodDate || new Date().toISOString();
  //   this.isPeriodDateOpen = true;
  // }

  closeBleedingDays(role: 'cancel' | 'confirm') {
    if (role === 'confirm') {
      this.bleedingDays = Number(this.tempBleedingDays);
    }

    this.isBleedingDaysOpen = false;

    setTimeout(() => {
      this.bleedingInput?.getInputElement().then((input) => input.blur());
    }, 0);
  }

  closeDurationPicker(role: 'cancel' | 'confirm') {
    if (role === 'confirm') {
      this.durationDays = Number(this.tempDurationDays);
    }

    this.isDurationDaysOpen = false;

    setTimeout(() => {
      this.durationInput?.getInputElement().then((input) => input.blur());
    }, 0);
  }

  closePeriodDate(role: 'cancel' | 'confirm') {
    if (role === 'confirm') {
      this.periodDate = this.periodDateIso; // ذخیره نهایی
    }
    this.isPeriodDateOpen = false;
  }

  toPersianNumber(value: number | string): string {
    return String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  }

  onBleedingDaysChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value != null) {
      this.tempBleedingDays = Number(value);
    }
  }

  onDurationDaysChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value != null) {
      this.tempDurationDays = Number(value);
    }
  }

  onPeriodDateChange(event: CustomEvent) {
    const value = (event.detail as any).value;
    if (value != null) {
      this.periodDateIso = String(value);
    }
  }

  onPeriodDateDismiss() {
    this.isPeriodDateOpen = false;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
  async openJalaliPicker() {
    // پیش‌فرض: امروز جلالی
    // می‌تونی اگر periodDateIso داری، از روی آن jy/jm/jd را هم استخراج کنیم (اگر خواستی می‌دم)
    const now = new Date();
    const tempJ = (await import('jalaali-js')).toJalaali(now); // {jy,jm,jd}

    const years = Array.from({ length: 60 }, (_, i) => 1360 + i); // ۱۳۶۰..۱۴۱۹ نمونه
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
      columns: [yearCol, monthCol, dayCol],
      buttons: [
        { text: 'انصراف', role: 'cancel' },
        {
          text: 'ثبت',
          handler: (value) => {
            const jy = value.year.value;
            const jm = value.month.value;
            const jd = value.day.value;
            this.periodDateIso = jalaliToIsoDate(jy, jm, jd);
          },
        },
      ],
      // وقتی سال/ماه عوض میشه تعداد روزها باید آپدیت بشه
      // Ionic Picker رو میشه با event تغییر ستون کنترل کرد؛ اگر نسخه‌ات اجازه داد:
      // اگر نگذاشت، یک راه ساده: با تغییر ماه/سال، picker را دوباره بسازیم.
    });

    await picker.present();
  }
}
