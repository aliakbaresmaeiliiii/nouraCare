import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonDatetime,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
  PickerController,
} from '@ionic/angular/standalone';
import {
  ReproductiveStatusService,
  ReproductiveStatusData,
  CreatePregnancyPlanningDto,
  PregnancyPlanningResponseDto,
  PeriodLogData,
} from '../shared/services/reproductive-status.service';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  heartOutline,
  bagOutline,
  checkmarkCircleOutline,
  calendarNumberOutline,
  analyticsOutline,
  chevronDown,
} from 'ionicons/icons';
import { HomeDataService } from '../home/services/home-data.service';

interface CycleFormData {
  lastPeriodDate: string;
  averageCycleLength: number | null;
  averagePeriodDuration: number | null;
  lifestyleGoals: string;
  notes: string;
}

@Component({
  selector: 'app-pregnancy-planning',
  templateUrl: './pregnancy-planning.component.html',
  styleUrls: ['./pregnancy-planning.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonNote,
  ],
})
export class PregnancyPlanningComponent implements OnInit {
  private reproductiveStatusService = inject(ReproductiveStatusService);
  private homeService = inject(HomeDataService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private pickerCtrl = inject(PickerController);

  // Reactive Form
  cycleForm: FormGroup;

  // UI state
  isLoading = signal(false);
  hasCycleData = signal(false);
  selectedMode = signal<'planning' | 'pregnancy'>('planning');
  showConfirmation = signal(false);

  // Calculated data
  fertileWindow = signal<{ start: Date; end: Date } | null>(null);
  nextPeriodDate = signal<Date | null>(null);
  ovulationDate = signal<Date | null>(null);

  // Pregnancy mode data
  pregnancyStartDate = '';
  estimatedDueDate = '';
  userId = 0;

  // Cache today's date to avoid ExpressionChangedAfterItHasBeenCheckedError
  private todayDate = '';

  // Computed properties
  isCycleFormValid = computed(() => this.cycleForm.valid);
  isTodayInFertileWindow = computed(() => {
    const today = new Date();
    const window = this.fertileWindow();
    return window ? today >= window.start && today <= window.end : false;
  });

  daysUntilNextPeriod = computed(() => {
    const nextPeriod = this.nextPeriodDate();
    if (!nextPeriod) return 0;
    const today = new Date();
    const diffTime = nextPeriod.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  constructor() {
    addIcons({
      calendarOutline,
      heartOutline,
      bagOutline,
      checkmarkCircleOutline,
      calendarNumberOutline,
      analyticsOutline,
      chevronDown,
    });

    // Initialize reactive form
    this.cycleForm = this.fb.group({
      lastPeriodDate: ['', [Validators.required]],
      averageCycleLength: [
        null,
        [Validators.required, Validators.min(20), Validators.max(40)],
      ],
      averagePeriodDuration: [
        null,
        [Validators.required, Validators.min(2), Validators.max(10)],
      ],
      lifestyleGoals: [''],
      notes: [''],
    });
  }

  ngOnInit() {
    this.userId = this.homeService.getCurrentUserId();
    this.loadReproductiveStatus();
  }

  loadReproductiveStatus() {
    this.isLoading.set(true);
    this.reproductiveStatusService
      .getReproductiveStatus(this.userId)
      .subscribe({
        next: (data) => {
          if (data.lastPeriodDate) {
            this.cycleForm.patchValue({
              lastPeriodDate: data.lastPeriodDate,
              averageCycleLength: data.cycleLength || null,
              averagePeriodDuration: data.averagePeriodDuration || null,
            });
            this.hasCycleData.set(true);
            this.calculateCycleData();
          }

          if (data.isPregnant) {
            this.selectedMode.set('pregnancy');
            if (data.pregnancyEndDate) {
              this.estimatedDueDate = data.pregnancyEndDate;
            }
          }

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading reproductive status:', error);
          this.isLoading.set(false);
        },
      });
  }

  getTodayDate(): string {
    // Use cached date to avoid ExpressionChangedAfterItHasBeenCheckedError
    if (!this.todayDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      this.todayDate = today.toISOString();
    }
    return this.todayDate;
  }

  calculateCycleData() {
    const lastPeriodDate = this.cycleForm.get('lastPeriodDate')?.value;
    const cycleLength = this.cycleForm.get('averageCycleLength')?.value;

    if (!lastPeriodDate || !cycleLength) return;

    // Convert month-year format to full date (use first day of month)
    const periodDate = new Date(lastPeriodDate);
    periodDate.setDate(1); // Set to first day of the month

    // Calculate next period
    const nextPeriod = this.reproductiveStatusService.calculateNextPeriod(
      periodDate.toISOString(),
      cycleLength
    );
    this.nextPeriodDate.set(nextPeriod);

    // Calculate fertile window
    const fertileWindow = this.reproductiveStatusService.calculateFertileWindow(
      periodDate.toISOString(),
      cycleLength
    );
    this.fertileWindow.set(fertileWindow);

    const ovulation = this.reproductiveStatusService.calculateOvulationDate(
      periodDate.toISOString(),
      cycleLength,
    );
    this.ovulationDate.set(ovulation);
  }

  // Number picker methods - Fixed to use proper Ionic picker
  async openCycleLengthPicker(): Promise<void> {
    const currentValue = this.cycleForm.get('averageCycleLength')?.value;
    const selectedValue = currentValue || 28; // Default to 28 days

    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'cycleLength',
          options: Array.from({ length: 21 }, (_, i) => ({
            text: `${i + 20} days`,
            value: i + 20,
          })),
          selectedIndex: selectedValue - 20,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'OK',
          handler: (value: any) => {
            this.cycleForm.patchValue({
              averageCycleLength: value.cycleLength.value,
            });
          },
        },
      ],
    });

    await picker.present();
  }

  async openPeriodDurationPicker(): Promise<void> {
    const currentValue = this.cycleForm.get('averagePeriodDuration')?.value;
    const selectedValue = currentValue || 5; // Default to 5 days

    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'periodDuration',
          options: Array.from({ length: 9 }, (_, i) => ({
            text: `${i + 2} days`,
            value: i + 2,
          })),
          selectedIndex: selectedValue - 2,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'OK',
          handler: (value: any) => {
            this.cycleForm.patchValue({
              averagePeriodDuration: value.periodDuration.value,
            });
          },
        },
      ],
    });

    await picker.present();
  }

  async openDatePicker(): Promise<void> {
    const currentValue = this.cycleForm.get('lastPeriodDate')?.value;
    const currentDate = currentValue ? new Date(currentValue) : new Date();

    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'month',
          options: [
            { text: 'January', value: '01' },
            { text: 'February', value: '02' },
            { text: 'March', value: '03' },
            { text: 'April', value: '04' },
            { text: 'May', value: '05' },
            { text: 'June', value: '06' },
            { text: 'July', value: '07' },
            { text: 'August', value: '08' },
            { text: 'September', value: '09' },
            { text: 'October', value: '10' },
            { text: 'November', value: '11' },
            { text: 'December', value: '12' },
          ],
          selectedIndex: currentDate.getMonth(),
        },
        {
          name: 'day',
          options: Array.from({ length: 31 }, (_, i) => ({
            text: (i + 1).toString(),
            value: (i + 1).toString().padStart(2, '0'),
          })),
          selectedIndex: currentDate.getDate() - 1,
        },
        {
          name: 'year',
          options: Array.from({ length: 10 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return { text: year.toString(), value: year.toString() };
          }),
          selectedIndex: 0,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'OK',
          handler: (value: any) => {
            const day = value.day.value;
            const month = value.month.value;
            const year = value.year.value;
            const dateString = `${year}-${month}-${day}`;
            this.cycleForm.patchValue({ lastPeriodDate: dateString });
          },
        },
      ],
    });

    await picker.present();
  }

  formatMonthYearDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  saveCycleData(): void {
    if (this.cycleForm.invalid) {
      this.showToast('Please fill in all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    const formValue = this.cycleForm.value;
    const payload: CreatePregnancyPlanningDto = {
      lastPeriodDate: new Date(formValue.lastPeriodDate).toISOString(),
      cycleLength: formValue.averageCycleLength,
      averagePeriodDuration:formValue.averagePeriodDuration,
      lifestyleGoals: 'test',
      notes: formValue.notes || 'Regular period tracking',
    };

    this.reproductiveStatusService
      .createPregnancyPlanning(this.userId, payload)
      .subscribe((res) => {
        console.log(res);
      });
  }

  private calculatePeriodEndDate(startDate: string, duration: number): Date {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (duration - 1));
    return end;
  }

  // private createPregnancyPlanWithCycleData(formValue: CycleFormData): void {
  //   const pregnancyPlanData: CreatePregnancyPlanningDto = {
  //     lastPeriodDate: formValue.lastPeriodDate,
  //     cycleLength: formValue.averageCycleLength || 28,
  //     lifestyleGoals: formValue.lifestyleGoals,
  //     notes: formValue.notes,
  //   };

  //   this.reproductiveStatusService
  //     .createPregnancyPlanning(pregnancyPlanData, this.userId)
  //     .subscribe({
  //       next: (response: PregnancyPlanningResponseDto) => {
  //         console.log('Pregnancy plan created successfully:', response);

  //         // Update calculations with server response
  //         if (response.fertileWindow) {
  //           this.fertileWindow.set({
  //             start: new Date(response.fertileWindow.start),
  //             end: new Date(response.fertileWindow.end),
  //           });
  //         }
  //         if (response.ovulationDate) {
  //           this.ovulationDate.set(new Date(response.ovulationDate));
  //         }
  //         if (response.nextPeriodDate) {
  //           this.nextPeriodDate.set(new Date(response.nextPeriodDate));
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error creating pregnancy plan:', error);
  //       },
  //     });
  // }

  updatePregnancyPlan() {
    if (this.cycleForm.get('lastPeriodDate')?.invalid) {
      this.showToast('Please select your last period date');
      return;
    }

    this.isLoading.set(true);
    const formValue = this.cycleForm.value;

    const pregnancyPlanData = {
      lastPeriodDate: formValue.lastPeriodDate,
      cycleLength: formValue.averageCycleLength || 28,
      lifestyleGoals: formValue.lifestyleGoals,
      notes: formValue.notes,
    };

    this.reproductiveStatusService
      .updateReproductiveStatus(this.userId, pregnancyPlanData)
      .subscribe({
        next: (response: PregnancyPlanningResponseDto) => {
          console.log('Pregnancy plan created successfully:', response);
          this.hasCycleData.set(true);
          this.isLoading.set(false);
          this.showToast('Pregnancy plan created successfully!');
        },
        error: (error) => {
          console.error('Error creating pregnancy plan:', error);
          this.isLoading.set(false);
          this.showToast('Error creating pregnancy plan. Please try again.');
        },
      });
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  goToNextStep(): void {
    this.router.navigate(['/tabs/home']);
    this.showToast('Welcome to your pregnancy journey!');
  }

  // Form control getters for template

  private showToast(message: string) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--ion-color-dark);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }
}
