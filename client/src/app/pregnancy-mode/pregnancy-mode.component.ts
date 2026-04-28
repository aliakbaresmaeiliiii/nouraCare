import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { OnboardingService } from '../shared/services/onboarding.service';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-pregnancy-mode',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './pregnancy-mode.component.html',
  styleUrls: ['./pregnancy-mode.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class PregnancyModeComponent implements AfterViewInit {
  private location = inject(Location);
  private alertController = inject(AlertController);
  private router = inject(Router);
  private onboardingService = inject(OnboardingService);
  private cycleSettings = inject(CycleSettingsService);
  @ViewChild('weekScroller') weekScroller?: ElementRef<HTMLDivElement>;
  @ViewChild('dayScroller') dayScroller?: ElementRef<HTMLDivElement>;

  gestationalWeek = 1;
  gestationalDay = 1;
  dueDateIso = '2027-01-23';
  multipleBabies = 'NO';
  todayIso = new Date().toISOString();
  maxDueDateIso = new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString();

  private initialState = {
    gestationalWeek: this.gestationalWeek,
    gestationalDay: this.gestationalDay,
    dueDateIso: this.dueDateIso,
    multipleBabies: this.multipleBabies,
  };

  weekOptions = Array.from({ length: 42 }, (_, index) => index + 1);
  dayOptions = Array.from({ length: 7 }, (_, index) => index + 1);
  multipleBabiesOptions: Array<'NO' | 'YES'> = ['NO', 'YES'];
  readonly wheelPaddingItems = 2;
  readonly wheelItemHeight = 52;

  get gestationalAge(): string {
    return `Weeks ${this.gestationalWeek}, day ${this.gestationalDay}`;
  }

  get dueDate(): string {
    const date = new Date(this.dueDateIso);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  get hasChanges(): boolean {
    return (
      this.gestationalWeek !== this.initialState.gestationalWeek ||
      this.gestationalDay !== this.initialState.gestationalDay ||
      this.dueDateIso !== this.initialState.dueDateIso ||
      this.multipleBabies !== this.initialState.multipleBabies
    );
  }

  close(): void {
    this.location.back();
  }

  async openDeletePregnancyDialog(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete pregnancy info',
      message: 'This will permanently delete all data about this pregnancy from the Flo',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            void this.confirmDeletePregnancyMode();
          },
        },
      ],
    });
    await alert.present();
  }

  private async confirmDeletePregnancyMode(): Promise<void> {
    const lastPeriodDate = this.cycleSettings.lastPeriodStartDate();
    const cycleLength = this.cycleSettings.cycleLength();
    try {
      await firstValueFrom(
        this.onboardingService.updateReproductiveState({
          state: 'cycle',
          lastPeriodDate: lastPeriodDate ?? undefined,
          cycleLength: cycleLength || 28,
        }),
      );
    } catch (error) {
      console.error('Failed to switch to cycle mode after deleting pregnancy data:', error);
    } finally {
      // Keep and reuse previously logged cycle values on Home.
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(false);
      this.cycleSettings.setPregnancyWeek(0);
      this.cycleSettings.setPregnancyProgress(0);
      this.cycleSettings.setUserStatus('Not Pregnant');
      this.cycleSettings.setSelectedCycleViewDate(null);
      await this.router.navigate(['/tabs/home']);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollWheelToSelection('week', false);
      this.scrollWheelToSelection('day', false);
    }, 0);
  }

  save(): void {
    if (!this.hasChanges) return;
    this.initialState = {
      gestationalWeek: this.gestationalWeek,
      gestationalDay: this.gestationalDay,
      dueDateIso: this.dueDateIso,
      multipleBabies: this.multipleBabies,
    };
  }

  onGestationalWeekChange(event: any): void {
    const nextWeek = Number(event?.detail?.value ?? this.gestationalWeek);
    if (!Number.isNaN(nextWeek)) this.gestationalWeek = nextWeek;
  }

  onGestationalDayChange(event: any): void {
    const nextDay = Number(event?.detail?.value ?? this.gestationalDay);
    if (!Number.isNaN(nextDay)) this.gestationalDay = nextDay;
  }

  get weekWheelItems(): Array<number | null> {
    return [
      ...Array.from({ length: this.wheelPaddingItems }, () => null),
      ...this.weekOptions,
      ...Array.from({ length: this.wheelPaddingItems }, () => null),
    ];
  }

  get dayWheelItems(): Array<number | null> {
    return [
      ...Array.from({ length: this.wheelPaddingItems }, () => null),
      ...this.dayOptions,
      ...Array.from({ length: this.wheelPaddingItems }, () => null),
    ];
  }

  onWeekScroll(event: Event): void {
    const el = event.target as HTMLDivElement;
    const idx = Math.round(el.scrollTop / this.wheelItemHeight) - this.wheelPaddingItems;
    const clamped = Math.max(0, Math.min(this.weekOptions.length - 1, idx));
    this.gestationalWeek = this.weekOptions[clamped];
  }

  onDayScroll(event: Event): void {
    const el = event.target as HTMLDivElement;
    const idx = Math.round(el.scrollTop / this.wheelItemHeight) - this.wheelPaddingItems;
    const clamped = Math.max(0, Math.min(this.dayOptions.length - 1, idx));
    this.gestationalDay = this.dayOptions[clamped];
  }

  selectWeek(value: number): void {
    this.gestationalWeek = value;
    this.scrollWheelToSelection('week', true);
  }

  selectDay(value: number): void {
    this.gestationalDay = value;
    this.scrollWheelToSelection('day', true);
  }

  private scrollWheelToSelection(type: 'week' | 'day', smooth: boolean): void {
    const isWeek = type === 'week';
    const scroller = isWeek ? this.weekScroller?.nativeElement : this.dayScroller?.nativeElement;
    const options = isWeek ? this.weekOptions : this.dayOptions;
    const selected = isWeek ? this.gestationalWeek : this.gestationalDay;
    if (!scroller) return;
    const baseIndex = options.findIndex((item) => item === selected);
    if (baseIndex < 0) return;
    const target = (baseIndex + this.wheelPaddingItems) * this.wheelItemHeight;
    scroller.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
  }

  get multipleBabiesPickerColumns(): any[] {
    return [
      {
        name: 'multipleBabies',
        selectedIndex: this.multipleBabies === 'YES' ? 1 : 0,
        options: this.multipleBabiesOptions.map((value) => ({
          text: value === 'YES' ? 'Yes' : 'No',
          value,
        })),
      },
    ];
  }

  get multipleBabiesPickerButtons(): any[] {
    return [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Done',
        handler: (value: any) => {
          this.multipleBabies = (value?.multipleBabies?.value ?? this.multipleBabies) as
            | 'YES'
            | 'NO';
        },
      },
    ];
  }
}
