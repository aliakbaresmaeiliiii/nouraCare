import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonDatetime,
  IonText,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonNote,
  IonSpinner,
} from '@ionic/angular/standalone';
import {
  ReproductiveStatusService,
  ReproductiveStatusData,
  CreatePregnancyPlanningDto,
  PregnancyPlanningResponseDto,
} from '../shared/services/reproductive-status.service';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  heartOutline,
  bagOutline,
  checkmarkCircleOutline,
  calendarNumberOutline,
  analyticsOutline,
} from 'ionicons/icons';
import { HomeDataService } from '../home/services/home-data.service';

@Component({
  selector: 'app-pregnancy-planning',
  templateUrl: './pregnancy-planning.component.html',
  styleUrls: ['./pregnancy-planning.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonSelect,
    IonSelectOption,
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
  homeService = inject(HomeDataService);
  private router = inject(Router);

  // Form data
  lastPeriodDate: string = '';
  selectedCycleLength: number = 28;
  cycleLengthOptions = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
  lifestyleGoals: string = '';
  notes: string = '';

  // Calculated data
  fertileWindow = signal<{ start: Date; end: Date } | null>(null);
  nextPeriodDate = signal<Date | null>(null);
  ovulationDate = signal<Date | null>(null);

  // UI state
  isLoading = signal(false);
  hasCycleData = signal(false);
  selectedMode = signal<'planning' | 'pregnancy'>('planning');

  // Pregnancy mode data
  pregnancyStartDate: string = '';
  estimatedDueDate: string = '';
  userId = 0;

  // Cached today date to prevent change detection errors
  todayDate = signal<string>('');

  constructor() {
    addIcons({
      calendarOutline,
      heartOutline,
      bagOutline,
      checkmarkCircleOutline,
      calendarNumberOutline,
      analyticsOutline,
    });
  }

  ngOnInit() {
    this.userId = this.homeService.getCurrentUserId();
    // Initialize today date once to prevent change detection errors
    this.todayDate.set(new Date().toISOString());
    this.loadReproductiveStatus();
  }

  loadReproductiveStatus() {
    this.isLoading.set(true);
    try {
      this.reproductiveStatusService
        .getReproductiveStatus(this.userId)
        .subscribe({
          next: (data) => {
            if (data.lastPeriodDate) {
              this.lastPeriodDate = data.lastPeriodDate;
              this.selectedCycleLength = data.averageCycleLength || 28;
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
    } catch (error) {
      console.error('Error loading reproductive status:', error);
      this.isLoading.set(false);
    }
  }

  getTodayDate(): string {
    return this.todayDate();
  }

  onSegmentChange(event: any) {
    const value = event.detail.value;
    if (value === 'planning' || value === 'pregnancy') {
      this.selectedMode.set(value);
    }
  }

  getDueDate(): Date | null {
    return this.estimatedDueDate ? new Date(this.estimatedDueDate) : null;
  }

  calculateCycleData() {
    if (!this.lastPeriodDate) return;

    // Calculate next period
    const nextPeriod = this.reproductiveStatusService.calculateNextPeriod(
      this.lastPeriodDate,
      this.selectedCycleLength
    );
    this.nextPeriodDate.set(nextPeriod);

    // Calculate fertile window
    const fertileWindow = this.reproductiveStatusService.calculateFertileWindow(
      this.lastPeriodDate,
      this.selectedCycleLength
    );
    this.fertileWindow.set(fertileWindow);

    // Calculate ovulation date (middle of fertile window)
    const ovulation = new Date(fertileWindow.start);
    ovulation.setDate(ovulation.getDate() + 2); // Approximate ovulation day
    this.ovulationDate.set(ovulation);
  }

  submitCycleTracking() {
    if (!this.lastPeriodDate) {
      this.showToast('Please select your last period date');
      return;
    }

    this.isLoading.set(true);
    const updateData: ReproductiveStatusData = {
      lastPeriodDate: this.lastPeriodDate,
      averageCycleLength: this.selectedCycleLength,
      isPregnant: false,
    };

    this.reproductiveStatusService
      .updateReproductiveStatus(this.userId, updateData)
      .subscribe({
        next: (response) => {
          console.log('Cycle data updated successfully:', response);
          this.hasCycleData.set(true);
          this.calculateCycleData();
          this.isLoading.set(false);
          this.showToast('Cycle data saved successfully!');
        },
        error: (error) => {
          console.error('Error updating cycle data:', error);
          this.isLoading.set(false);
          this.showToast('Error saving data. Please try again.');
        },
      });
  }

  createPregnancyPlan() {
    if (!this.lastPeriodDate) {
      this.showToast('Please select your last period date');
      return;
    }

    this.isLoading.set(true);
    const pregnancyPlanData: CreatePregnancyPlanningDto = {
      lastPeriodDate: this.lastPeriodDate,
      cycleLength: this.selectedCycleLength,
      lifestyleGoals: this.lifestyleGoals,
      notes: this.notes,
    };

    this.reproductiveStatusService
      .createPregnancyPlanning(pregnancyPlanData,this.userId)
      .subscribe({
        next: (response: PregnancyPlanningResponseDto) => {
          console.log('Pregnancy plan created successfully:', response);
          this.hasCycleData.set(true);

          // Update local calculations with server response
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

  switchToPregnancyMode() {
    if (!this.lastPeriodDate) {
      this.showToast('Please enter your cycle data first');
      return;
    }

    // Calculate estimated due date (40 weeks from last period)
    const lastPeriod = new Date(this.lastPeriodDate);
    const dueDate = new Date(lastPeriod);
    dueDate.setDate(dueDate.getDate() + 280); // 40 weeks

    this.pregnancyStartDate = new Date().toISOString();
    this.estimatedDueDate = dueDate.toISOString();

    this.isLoading.set(true);
    const updateData: ReproductiveStatusData = {
      isPregnant: true,
      pregnancyEndDate: this.estimatedDueDate,
      lastPeriodDate: this.lastPeriodDate,
      averageCycleLength: this.selectedCycleLength,
    };

    this.reproductiveStatusService
      .updateReproductiveStatus(this.userId, updateData)
      .subscribe({
        next: (response) => {
          console.log('Switched to pregnancy mode:', response);
          this.selectedMode.set('pregnancy');
          this.isLoading.set(false);
          this.showToast('Congratulations! Switched to pregnancy mode.');
        },
        error: (error) => {
          console.error('Error switching to pregnancy mode:', error);
          this.isLoading.set(false);
          this.showToast('Error switching mode. Please try again.');
        },
      });
  }

  switchToPlanningMode() {
    this.isLoading.set(true);
    const updateData: ReproductiveStatusData = {
      isPregnant: false,
      pregnancyEndDate: undefined,
    };

    this.reproductiveStatusService
      .updateReproductiveStatus(this.userId, updateData)
      .subscribe({
        next: (response) => {
          console.log('Switched to planning mode:', response);
          this.selectedMode.set('planning');
          this.isLoading.set(false);
          this.showToast('Switched back to planning mode.');
        },
        error: (error) => {
          console.error('Error switching to planning mode:', error);
          this.isLoading.set(false);
          this.showToast('Error switching mode. Please try again.');
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

  isTodayInFertileWindow(): boolean {
    const today = new Date();
    const window = this.fertileWindow();

    if (!window) return false;

    return today >= window.start && today <= window.end;
  }

  getDaysUntilNextPeriod(): number {
    const nextPeriod = this.nextPeriodDate();
    if (!nextPeriod) return 0;

    const today = new Date();
    const diffTime = nextPeriod.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilDueDate(): number {
    if (!this.estimatedDueDate) return 0;

    const dueDate = new Date(this.estimatedDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPregnancyWeek(): number {
    if (!this.lastPeriodDate) return 0;

    const lastPeriod = new Date(this.lastPeriodDate);
    const today = new Date();
    const diffTime = today.getTime() - lastPeriod.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.floor(diffDays / 7);
  }

  goToNextStep(): void {
    // Navigate to home page or next appropriate step
    this.router.navigate(['/tabs/home']);
    this.showToast('Welcome to your pregnancy journey!');
  }

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
