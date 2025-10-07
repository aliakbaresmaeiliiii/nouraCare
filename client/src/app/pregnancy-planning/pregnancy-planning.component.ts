import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl, AbstractControl } from '@angular/forms';
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
    IonDatetime,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
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
      averageCycleLength: [null, [Validators.required, Validators.min(20), Validators.max(40)]],
      averagePeriodDuration: [null, [Validators.required, Validators.min(2), Validators.max(10)]],
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
              averageCycleLength: data.averageCycleLength || null,
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

    // Calculate next period
    const nextPeriod = this.reproductiveStatusService.calculateNextPeriod(
      lastPeriodDate,
      cycleLength
    );
    this.nextPeriodDate.set(nextPeriod);

    // Calculate fertile window
    const fertileWindow = this.reproductiveStatusService.calculateFertileWindow(
      lastPeriodDate,
      cycleLength
    );
    this.fertileWindow.set(fertileWindow);

    // Calculate ovulation date (middle of fertile window)
    const ovulation = new Date(fertileWindow.start);
    ovulation.setDate(ovulation.getDate() + 2);
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
            this.cycleForm.patchValue({ averageCycleLength: value.cycleLength.value });
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
            this.cycleForm.patchValue({ averagePeriodDuration: value.periodDuration.value });
          },
        },
      ],
    });

    await picker.present();
  }

  saveCycleData(): void {
    if (this.cycleForm.invalid) {
      this.showToast('Please fill in all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    const formValue = this.cycleForm.value;

    // Create period log data - try sending as ISO string that backend can parse
    const periodLogData: PeriodLogData = {
      lastPeriodDate: new Date(formValue.lastPeriodDate).toISOString(),
      mood: "Normal",
      notes: formValue.notes || "Regular period tracking",
      averagePeriodDuration: formValue.averagePeriodDuration
    };

    console.log('Sending period log data to API:', periodLogData);
    console.log('lastPeriodDate type:', typeof periodLogData.lastPeriodDate);
    console.log('lastPeriodDate value:', periodLogData.lastPeriodDate);

    this.reproductiveStatusService
      .createPeriodLog(this.userId, periodLogData)
      .subscribe({
        next: (response) => {
          console.log('Period log created successfully:', response);
          this.hasCycleData.set(true);
          this.calculateCycleData();
          this.isLoading.set(false);

          // Show confirmation
          this.showConfirmation.set(true);
          setTimeout(() => this.showConfirmation.set(false), 5000);

          this.showToast('Cycle information saved successfully!');

          // Create pregnancy planning record
          this.createPregnancyPlanWithCycleData(formValue);
        },
        error: (error) => {
          console.error('Error creating period log:', error);
          this.isLoading.set(false);
          this.showToast('Error saving data. Please try again.');
        },
      });
  }

  private calculatePeriodEndDate(startDate: string, duration: number): Date {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (duration - 1));
    return end;
  }

  private createPregnancyPlanWithCycleData(formValue: CycleFormData): void {
    const pregnancyPlanData: CreatePregnancyPlanningDto = {
      lastPeriodDate: formValue.lastPeriodDate,
      cycleLength: formValue.averageCycleLength || 28,
      lifestyleGoals: formValue.lifestyleGoals,
      notes: formValue.notes,
    };

    this.reproductiveStatusService
      .createPregnancyPlanning(pregnancyPlanData, this.userId)
      .subscribe({
        next: (response: PregnancyPlanningResponseDto) => {
          console.log('Pregnancy plan created successfully:', response);

          // Update calculations with server response
          if (response.fertileWindow) {
            this.fertileWindow.set({
              start: new Date(response.fertileWindow.start),
              end: new Date(response.fertileWindow.end),
            });
          }
          if (response.ovulationDate) {
            this.ovulationDate.set(new Date(response.ovulationDate));
          }
          if (response.nextPeriodDate) {
            this.nextPeriodDate.set(new Date(response.nextPeriodDate));
          }
        },
        error: (error) => {
          console.error('Error creating pregnancy plan:', error);
        },
      });
  }

  createPregnancyPlan() {
    if (this.cycleForm.get('lastPeriodDate')?.invalid) {
      this.showToast('Please select your last period date');
      return;
    }

    this.isLoading.set(true);
    const formValue = this.cycleForm.value;

    const pregnancyPlanData: CreatePregnancyPlanningDto = {
      lastPeriodDate: formValue.lastPeriodDate,
      cycleLength: formValue.averageCycleLength || 28,
      lifestyleGoals: formValue.lifestyleGoals,
      notes: formValue.notes,
    };

    this.reproductiveStatusService
      .createPregnancyPlanning(pregnancyPlanData, this.userId)
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
