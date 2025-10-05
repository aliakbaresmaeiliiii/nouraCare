import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { UserInfoService, OnboardingData } from '../shared/services/user-info.service';
import { OnboardingService, OnboardingDataDto } from '../shared/services/onboarding.service';
import { OnboardingStateService } from '../shared/services/onboarding-state.service';
import { SharedModule } from '../shared/shared-module';

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
  imports: [SharedModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OnboardingComponent implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private cycleSettings = inject(CycleSettingsService);
  private userInfoService = inject(UserInfoService);
  private onboardingService = inject(OnboardingService);
  private onboardingStateService = inject(OnboardingStateService);

  currentStep = 0;
  answers: { [key: string]: any } = {};
  isCompleted = false;
  sessionId: string | null = null;
  isSaving = false;

  steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Gahvaremi! 👋',
      subtitle: 'Let\'s personalize your experience',
      question: 'We\'ll ask you a few questions to provide the best support for your journey.',
      type: 'radio',
      options: [
        { label: 'Let\'s get started!', value: 'start', icon: '🚀' }
      ],
      required: true
    },
    {
      id: 'pregnancy_status',
      title: 'What\'s your current status?',
      subtitle: 'This helps us show you the right content',
      question: 'Are you currently pregnant or trying to conceive?',
      type: 'radio',
      options: [
        { label: 'I\'m pregnant', value: 'pregnant', icon: '🤰' },
        { label: 'I\'m trying to conceive', value: 'trying', icon: '💕' },
        { label: 'I\'m postpartum', value: 'postpartum', icon: '👶' },
        { label: 'Just tracking my cycle', value: 'tracking', icon: '📅' }
      ],
      required: true
    },
    {
      id: 'last_period',
      title: 'When was your last period?',
      subtitle: 'This helps us calculate your cycle',
      question: 'Please enter the start date of your last menstrual period.',
      type: 'date',
      placeholder: 'Select date',
      required: true
    },
    {
      id: 'cycle_length',
      title: 'What\'s your cycle length?',
      subtitle: 'How many days between periods?',
      question: 'On average, how many days are there between the start of your periods?',
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
        { label: '35 days', value: 35 }
      ],
      required: true
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
        { label: '8 days', value: 8 }
      ],
      required: true
    },
    {
      id: 'pregnancy_week',
      title: 'What week are you in?',
      subtitle: 'Only if you\'re pregnant',
      question: 'If you\'re pregnant, what week are you currently in?',
      type: 'select',
      options: Array.from({ length: 37 }, (_, i) => ({
        label: `Week ${i + 4}`,
        value: i + 4
      })),
      required: false
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
        { label: 'Community support', value: 'community', icon: '👥' }
      ],
      required: true
    },
    {
      id: 'notifications',
      title: 'Stay informed! 🔔',
      subtitle: 'Get helpful reminders',
      question: 'Would you like to receive notifications for period reminders, ovulation alerts, and health tips?',
      type: 'radio',
      options: [
        { label: 'Yes, send me notifications', value: 'yes', icon: '✅' },
        { label: 'No, I\'ll check manually', value: 'no', icon: '❌' }
      ],
      required: true
    }
  ];

  ngOnInit() {
    // Initialize with default values
    this.answers = {
      cycle_length: 28,
      period_length: 5,
      notifications: 'yes'
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

  get progressPercentage(): number {
    return ((this.currentStep + 1) / this.steps.length) * 100;
  }

  get canProceed(): boolean {
    const step = this.currentStepData;
    if (!step.required) return true;
    return this.answers[step.id] !== undefined && this.answers[step.id] !== null && this.answers[step.id] !== '';
  }

  selectOption(stepId: string, value: any) {
    this.answers[stepId] = value;
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
            health_goals: response.data.health_goals ? JSON.parse(response.data.health_goals) : [],
            notifications: response.data.notifications
          };
        }
      },
      error: (error) => {
        console.error('Error loading existing onboarding data:', error);
        // Clear invalid session ID
        this.onboardingService.clearSessionId();
        this.sessionId = null;
      }
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
      last_period: this.answers['last_period'] || null,
      cycle_length: this.answers['cycle_length'] || 28,
      period_length: this.answers['period_length'] || 5,
      pregnancy_week: this.answers['pregnancy_week'] || undefined,
      health_goals: JSON.stringify(this.answers['health_goals'] || []),
      notifications: this.answers['notifications'] || 'yes'
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
      }
    });
  }

  /**
   * Complete onboarding and redirect to login for registration
   */
  async completeOnboarding() {

    // Save final onboarding data
    this.saveOnboardingProgress();

    // Save to local services for immediate use
    this.saveAnswers();

    // Show completion screen briefly, then navigate to register
    this.isCompleted = true;
    
    // Navigate to register/sign-in page after a short delay
    setTimeout(() => {
    this.router.navigate(['/auth/sign-in']);
    }, 2000); // 2 second delay to show completion message

  }



  /**
   * Show error alert
   */
  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  private saveAnswers() {
    // Save basic cycle information
    this.cycleSettings.setCycleLength(this.answers['cycle_length'] || 28);
    this.cycleSettings.setPeriodLength(this.answers['period_length'] || 5);

    if (this.answers['last_period']) {
      this.cycleSettings.setLastPeriodStart(this.answers['last_period']);
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
    localStorage.setItem('health_goals', JSON.stringify(this.answers['health_goals']));
    localStorage.setItem('notifications_enabled', this.answers['notifications'] === 'yes' ? 'true' : 'false');
    
    // Store complete onboarding data for registration
    const onboardingData = {
      pregnancy_status: this.answers['pregnancy_status'] || 'tracking',
      last_period: this.answers['last_period'] || null,
      cycle_length: this.answers['cycle_length'] || 28,
      period_length: this.answers['period_length'] || 5,
      pregnancy_week: this.answers['pregnancy_week'] || undefined,
      health_goals: JSON.stringify(this.answers['health_goals'] || []),
      notifications: this.answers['notifications'] || 'yes'
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
