import {
  Component,
  OnInit,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import {
  UserInfoService,
  OnboardingData,
} from '../shared/services/user-info.service';
import {
  OnboardingService,
  OnboardingDataDto,
  InitializeReproductiveStateDto,
} from '../shared/services/onboarding.service';
import { OnboardingStateService } from '../shared/services/onboarding-state.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { NotificationPermissionComponent } from '../shared/components/notification-permission/notification-permission.component';
import { AuthService } from '../auth/services/auth';
import {
  addCalendarDaysIso,
  gestationalWeekFromLmp,
  isoDateOnly,
  isCalendarDateNotAfterToday,
  lmpIsoFromLastBleedingDay,
} from '../shared/utils/pregnancy-lmp.util';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  question: string;
  type: 'radio' | 'date' | 'number' | 'select';
  options?: { label: string; value: any; icon?: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  required: boolean;
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, NotificationPermissionComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OnboardingComponent implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private cycleSettings = inject(CycleSettingsService);
  private userInfoService = inject(UserInfoService);
  private onboardingService = inject(OnboardingService);
  private onboardingStateService = inject(OnboardingStateService);
  private authService = inject(AuthService);

  currentStep = 0;
  answers: { [key: string]: any } = {};
  isCompleted = false;
  sessionId: string | null = null;
  isSaving = false;

  steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to NouraCare! 👋',
      subtitle: "Let's personalize your experience",
      question:
        "We'll ask you a few questions to provide the best support for your journey.",
      type: 'radio',
      options: [{ label: "Let's get started!", value: 'start', icon: '🚀' }],
      required: true,
    },
    {
      id: 'pregnancy_status',
      title: "What's your current status?",
      subtitle: 'This helps us show you the right content',
      question: 'Are you currently pregnant or trying to conceive?',
      type: 'radio',
      options: [
        { label: "I'm pregnant", value: 'pregnant', icon: '🤰' },
        { label: "I'm trying to conceive", value: 'trying', icon: '💕' },
        { label: "I'm postpartum", value: 'postpartum', icon: '👶' },
        { label: 'Just tracking my cycle', value: 'tracking', icon: '📅' },
      ],
      required: true,
    },
    {
      id: 'period_length',
      title: 'How long do your periods last?',
      subtitle: 'Number of bleeding days',
      question: 'On average, how many days does your period last?',
      type: 'select',
      options: [
        { label: '2 days', value: 2 },
        { label: '3 days', value: 3 },
        { label: '4 days', value: 4 },
        { label: '5 days (most common)', value: 5 },
        { label: '6 days', value: 6 },
        { label: '7 days', value: 7 },
        { label: '8 days', value: 8 },
      ],
      required: true,
    },
    {
      id: 'cycle_length',
      title: "What's your cycle length?",
      subtitle: 'How many days between periods?',
      question:
        'On average, how many days are there between the start of your periods?',
      type: 'select',
      options: [
        { label: '21 days', value: 21 },
        { label: '22 days', value: 22 },
        { label: '23 days', value: 23 },
        { label: '24 days', value: 24 },
        { label: '25 days', value: 25 },
        { label: '26 days', value: 26 },
        { label: '27 days', value: 27 },
        { label: '28 days (most common)', value: 28 },
        { label: '29 days', value: 29 },
        { label: '30 days', value: 30 },
        { label: '31 days', value: 31 },
        { label: '32 days', value: 32 },
        { label: '33 days', value: 33 },
        { label: '34 days', value: 34 },
        { label: '35 days', value: 35 },
      ],
      required: true,
    },
    {
      id: 'last_period',
      title: 'When was your last period?',
      subtitle: 'This helps us calculate your cycle',
      question: 'Please enter the start date of your last menstrual period.',
      type: 'date',
      placeholder: 'Select date',
      required: true,
    },
    {
      id: 'pregnancy_week',
      title: 'What week are you in?',
      subtitle: "Only if you're pregnant",
      question: "If you're pregnant, what week are you currently in?",
      type: 'select',
      options: Array.from({ length: 37 }, (_, i) => ({
        label: `Week ${i + 4}`,
        value: i + 4,
      })),
      required: false,
    },
    {
      id: 'health_goals',
      title: 'What are your health goals?',
      subtitle: 'Help us personalize your experience',
      question: 'What would you like to focus on? (You can select multiple)',
      type: 'radio',
      options: [
        { label: 'Track my cycle', value: 'cycle_tracking', icon: '📊' },
        { label: 'Monitor symptoms', value: 'symptoms', icon: '🏥' },
        { label: 'Nutrition guidance', value: 'nutrition', icon: '🥗' },
        { label: 'Exercise tips', value: 'exercise', icon: '💪' },
        { label: 'Mental health support', value: 'mental_health', icon: '🧘' },
        { label: 'Community support', value: 'community', icon: '👥' },
      ],
      required: true,
    },
    {
      id: 'notifications',
      title: 'Stay informed! 🔔',
      subtitle: 'Get helpful reminders',
      question:
        'Would you like to receive notifications for period reminders, ovulation alerts, and health tips?',
      type: 'radio',
      options: [
        { label: 'Yes, send me notifications', value: 'yes', icon: '✅' },
        { label: "No, I'll check manually", value: 'no', icon: '❌' },
      ],
      required: true,
    },
  ];

  ngOnInit() {
    // Initialize with default values
    this.answers = {
      cycle_length: 28,
      period_length: 5,
      notifications: 'yes',
    };

    // Check for existing session
    this.sessionId = this.onboardingService.getSessionId();
    if (this.sessionId) {
      this.loadExistingOnboardingData();
    }
  }

  get currentStepData(): OnboardingStep {
    return this.steps[this.currentStep];
  }

  getStepTitle(): string {
    const s = this.currentStepData;
    if (s.id === 'last_period' && this.answers['pregnancy_status'] === 'pregnant') {
      return 'Last day of your last period';
    }
    return s.title;
  }

  getStepSubtitle(): string {
    const s = this.currentStepData;
    if (s.id === 'last_period' && this.answers['pregnancy_status'] === 'pregnant') {
      return 'We use this with your usual bleed length to find day 1 of that period (LMP), then your pregnancy week.';
    }
    if (s.id === 'pregnancy_week' && this.answers['pregnancy_status'] === 'pregnant') {
      return 'Estimated from your bleeding dates. Change only if your clinician gave a different week.';
    }
    return s.subtitle;
  }

  getStepQuestion(): string {
    const s = this.currentStepData;
    if (s.id === 'last_period' && this.answers['pregnancy_status'] === 'pregnant') {
      return 'Choose the last day you still had bleeding from your most recent period (not a future date).';
    }
    if (s.id === 'pregnancy_week' && this.answers['pregnancy_status'] === 'pregnant') {
      return 'Your estimated week of pregnancy (based on LMP from those dates):';
    }
    return s.question;
  }

  getLastPeriodValidationMessage(): string {
    const raw = this.answers['last_period'];
    const iso = isoDateOnly(typeof raw === 'string' ? raw : '');
    if (!iso) {
      return '';
    }
    if (this.answers['pregnancy_status'] === 'pregnant') {
      if (!isCalendarDateNotAfterToday(iso)) {
        return 'That date cannot be in the future.';
      }
      const pl = Number(this.answers['period_length']) || 5;
      const lmp = lmpIsoFromLastBleedingDay(iso, pl);
      const week = gestationalWeekFromLmp(lmp);
      if (week < 4) {
        return 'From these dates, pregnancy would be under 4 weeks. Check the last bleeding day and how many days you usually bleed, or confirm with your clinician.';
      }
      if (week > 40) {
        return 'From these dates, pregnancy would be over 40 weeks. Double-check the last bleeding day and bleed length.';
      }
      return '';
    }
    if (!isCalendarDateNotAfterToday(iso)) {
      return 'The start date of your last menstrual period cannot be in the future.';
    }
    return '';
  }

  get progressPercentage(): number {
    return ((this.currentStep + 1) / this.steps.length) * 100;
  }

  get canProceed(): boolean {
    const step = this.currentStepData;
    if (!step.required) return true;

    // For last period date, check if it's valid (not in future)
    if (step.id === 'last_period' && this.answers[step.id]) {
      return this.isValidLastPeriodDate(this.answers[step.id]);
    }

    return (
      this.answers[step.id] !== undefined &&
      this.answers[step.id] !== null &&
      this.answers[step.id] !== ''
    );
  }

  selectOption(stepId: string, value: any) {
    // For last period date, validate before setting
    if (stepId === 'last_period' && value) {
      if (!this.isValidLastPeriodDate(value)) {
        this.showDateValidationError();
        return;
      }
    }

    this.answers[stepId] = value;

    if (
      (stepId === 'last_period' || stepId === 'period_length') &&
      this.answers['pregnancy_status'] === 'pregnant'
    ) {
      this.syncPregnancyWeekFromLastPeriodAnchor();
    }
  }

  /**
   * Get maximum selectable date (today)
   */
  getMaxDate(): string {
    return new Date().toISOString();
  }

  /**
   * Last-period step: cycle users enter LMP start; pregnant users enter last bleeding day
   * (converted to LMP using period length when saving).
   */
  isValidLastPeriodDate(dateString: string): boolean {
    const iso = isoDateOnly(dateString);
    if (!iso) {
      return false;
    }
    if (this.answers['pregnancy_status'] === 'pregnant') {
      return this.isValidPregnancyLastBleedAnchor(iso);
    }
    return isCalendarDateNotAfterToday(iso);
  }

  private isValidPregnancyLastBleedAnchor(lastBleedIso: string): boolean {
    if (!isCalendarDateNotAfterToday(lastBleedIso)) {
      return false;
    }
    const pl = Number(this.answers['period_length']) || 5;
    if (!Number.isFinite(pl) || pl < 1) {
      return false;
    }
    const lmp = lmpIsoFromLastBleedingDay(lastBleedIso, pl);
    const week = gestationalWeekFromLmp(lmp);
    return week >= 4 && week <= 40;
  }

  private syncPregnancyWeekFromLastPeriodAnchor(): void {
    if (this.answers['pregnancy_status'] !== 'pregnant') {
      return;
    }
    const bleed = isoDateOnly(this.answers['last_period']);
    if (!bleed) {
      return;
    }
    const pl = Number(this.answers['period_length']) || 5;
    if (!this.isValidPregnancyLastBleedAnchor(bleed)) {
      delete this.answers['pregnancy_week'];
      return;
    }
    const lmp = lmpIsoFromLastBleedingDay(bleed, pl);
    const week = gestationalWeekFromLmp(lmp);
    this.answers['pregnancy_week'] = week;
  }

  private getEffectiveLmpIsoForStorage(): string | null {
    const raw = isoDateOnly(this.answers['last_period']);
    if (!raw) {
      return null;
    }
    if (this.answers['pregnancy_status'] === 'pregnant') {
      const pl = Number(this.answers['period_length']) || 5;
      return lmpIsoFromLastBleedingDay(raw, pl);
    }
    return raw;
  }

  /**
   * Show validation error for invalid date selection
   */
  private async showDateValidationError() {
    const msg =
      this.answers['pregnancy_status'] === 'pregnant'
        ? this.getLastPeriodValidationMessage() ||
          'Please choose a valid last bleeding day so pregnancy timing is between 4 and 40 weeks.'
        : 'The start date of your last menstrual period cannot be in the future. Please select a valid date.';
    const alert = await this.alertController.create({
      header: 'Invalid Date',
      message: msg,
      buttons: ['OK'],
    });

    await alert.present();
  }

  nextStep() {
    if (this.canProceed) {
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++;
        // Save progress after each step
        this.saveOnboardingProgress();
      } else {
        this.completeOnboarding();
      }
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  skipStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    } else {
      this.completeOnboarding();
    }
  }

  /**
   * Load existing onboarding data from session
   */
  private loadExistingOnboardingData() {
    if (!this.sessionId) return;

    this.onboardingService.getOnboardingData(this.sessionId).subscribe({
      next: (response) => {
        console.log('Loaded existing onboarding data:', response);
        if (response.data) {
          this.answers = {
            pregnancy_status: response.data.pregnancy_status,
            last_period: response.data.last_period,
            cycle_length: response.data.cycle_length,
            period_length: response.data.period_length,
            pregnancy_week: response.data.pregnancy_week,
            health_goals: response.data.health_goals
              ? JSON.parse(response.data.health_goals)
              : [],
            notifications: response.data.notifications,
          };
          // API stores LMP for pregnant users; date step asks for last bleeding day.
          if (
            this.answers['pregnancy_status'] === 'pregnant' &&
            this.answers['last_period']
          ) {
            const lmp = isoDateOnly(this.answers['last_period']);
            const pl = Number(this.answers['period_length']) || 5;
            if (lmp) {
              this.answers['last_period'] = addCalendarDaysIso(lmp, pl - 1);
            }
            this.syncPregnancyWeekFromLastPeriodAnchor();
          }
        }
      },
      error: (error) => {
        console.error('Error loading existing onboarding data:', error);
        // Clear invalid session ID
        this.onboardingService.clearSessionId();
        this.sessionId = null;
      },
    });
  }

  /**
   * Save onboarding progress to API
   */
  private saveOnboardingProgress() {
    if (this.isSaving) return;

    this.isSaving = true;

    const onboardingData: OnboardingDataDto = {
      pregnancy_status: this.answers['pregnancy_status'] || 'tracking',
      last_period: this.getEffectiveLmpIsoForStorage(),
      cycle_length: this.answers['cycle_length'] || 28,
      period_length: this.answers['period_length'] || 5,
      pregnancy_week: this.answers['pregnancy_week'] || undefined,
      health_goals: JSON.stringify(this.answers['health_goals'] || []),
      notifications: this.answers['notifications'] || 'yes',
    };

    this.onboardingService.saveOnboardingData(onboardingData).subscribe({
      next: (response) => {
        console.log('Onboarding data saved successfully:', response);
        this.sessionId = response.sessionId;
        this.onboardingService.saveSessionId(this.sessionId);
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving onboarding data:', error);
        this.isSaving = false;
        this.showErrorAlert('Failed to save your progress. Please try again.');
      },
    });
  }

  /**
   * Complete onboarding and redirect to registration
   */
  async completeOnboarding() {
    const reproductivePayload = this.toReproductivePayload();
    this.saveAnswers();
    this.saveOnboardingProgress();

    if (this.authService.getAccessToken()) {
      this.onboardingService.initializeReproductiveState(reproductivePayload).subscribe({
        next: () => {
          this.isCompleted = true;
          setTimeout(() => this.router.navigate(['/tabs/home']), 1200);
        },
        error: () => {
          this.showErrorAlert('Failed to initialize your health profile. Please try again.');
        },
      });
      return;
    }

    this.isCompleted = true;
    setTimeout(() => {
      this.router.navigate(['/auth/sign-in'], {
        queryParams: { tab: 'register' },
      });
    }, 2000);
  }

  private toReproductivePayload(): InitializeReproductiveStateDto {
    const status = this.answers['pregnancy_status'];
    const mappedState =
      status === 'pregnant'
        ? 'pregnant'
        : status === 'postpartum'
          ? 'postpartum'
          : status === 'trying'
            ? 'planning'
            : 'cycle';
    const lmp = this.getEffectiveLmpIsoForStorage();
    return {
      state: mappedState,
      lastPeriodDate: lmp || undefined,
      cycleLength: this.answers['cycle_length'] || undefined,
      currentWeek: this.answers['pregnancy_week'] || undefined,
      tryingSince: mappedState === 'planning' ? lmp || undefined : undefined,
      pregnancyStartDate: mappedState === 'pregnant' ? lmp || undefined : undefined,
    };
  }

  /**
   * Show error alert
   */
  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK'],
    });

    await alert.present();
  }

  private saveAnswers() {
    // Save basic cycle information
    this.cycleSettings.setCycleLength(this.answers['cycle_length'] || 28);
    this.cycleSettings.setPeriodLength(this.answers['period_length'] || 5);

    const lmp = this.getEffectiveLmpIsoForStorage();
    if (lmp) {
      this.cycleSettings.setLastPeriodStart(lmp);
    }

    // Save pregnancy status
    const pregnancyStatus = this.answers['pregnancy_status'];
    if (pregnancyStatus === 'pregnant') {
      this.cycleSettings.setUserStatus('Pregnant');
      this.cycleSettings.setPregnancyStatus(true);
      this.cycleSettings.setPostpartumStatus(false);

      if (this.answers['pregnancy_week']) {
        this.cycleSettings.setPregnancyWeek(this.answers['pregnancy_week']);
        const progress = (this.answers['pregnancy_week'] / 40) * 100;
        this.cycleSettings.setPregnancyProgress(progress);
      }
    } else if (pregnancyStatus === 'postpartum') {
      this.cycleSettings.setUserStatus('Postpartum');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(true);
    } else {
      this.cycleSettings.setUserStatus('Trying to Conceive');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(false);
    }

    // Save other preferences (you can extend this)
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem(
      'health_goals',
      JSON.stringify(this.answers['health_goals']),
    );
    localStorage.setItem(
      'notifications_enabled',
      this.answers['notifications'] === 'yes' ? 'true' : 'false',
    );

    // Store complete onboarding data for registration
    const onboardingData = {
      pregnancy_status: this.answers['pregnancy_status'] || 'tracking',
      last_period: this.getEffectiveLmpIsoForStorage(),
      cycle_length: this.answers['cycle_length'] || 28,
      period_length: this.answers['period_length'] || 5,
      pregnancy_week: this.answers['pregnancy_week'] || undefined,
      health_goals: JSON.stringify(this.answers['health_goals'] || []),
      notifications: this.answers['notifications'] || 'yes',
    };
    localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));

    // Mark onboarding as completed for this user
    this.onboardingStateService.markOnboardingCompleted();
  }

  navigateToWelcome() {
    // After completing onboarding, navigate to registration/sign-in
    this.router.navigate(['/auth/sign-in']);
  }
}
