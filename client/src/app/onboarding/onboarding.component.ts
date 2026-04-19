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
  OnboardingService,
  OnboardingDataDto,
  InitializeReproductiveStateDto,
} from '../shared/services/onboarding.service';
import { OnboardingStateService } from '../shared/services/onboarding-state.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { AuthService } from '../auth/services/auth';
import {
  addCalendarDaysIso,
  gestationalWeekFromLmp,
  isoDateOnly,
  isCalendarDateNotAfterToday,
  normalizeLmpInput,
} from '../shared/utils/pregnancy-lmp.util';
import { ReproductiveStatusService } from '../shared/services/reproductive-status.service';
import { FirstWeekPlanService } from '../shared/services/first-week-plan.service';
import { HomeReproductiveUiService } from '../home/services/home-reproductive-ui.service';
import { HomeJourneyBridgeService } from '../home/services/home-journey-bridge.service';
import {
  buildCycleLmpDatetimeHighlights,
  ionDatetimeTodayHighlight,
} from '../shared/utils/ion-datetime-today-highlight.util';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  question: string;
  type: 'radio' | 'date' | 'number' | 'select' | 'notify' | 'result';
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
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OnboardingComponent implements OnInit {
  /** Marks the current local calendar day in `ion-datetime` (last period step). */
  readonly datetimeHighlightedToday = ionDatetimeTodayHighlight();

  /** Last-period calendar: period span (dashed) + estimated ovulation day (green) + today. */
  get lastPeriodDatetimeHighlights() {
    return buildCycleLmpDatetimeHighlights(
      this.answers['last_period'],
      Number(this.answers['cycle_length']) || this.cycleSettings.cycleLength() || 28,
      Number(this.answers['period_length']) || this.cycleSettings.periodLength() || 5,
    );
  }

  private router = inject(Router);
  private alertController = inject(AlertController);
  private cycleSettings = inject(CycleSettingsService);
  private onboardingService = inject(OnboardingService);
  private onboardingStateService = inject(OnboardingStateService);
  readonly authService = inject(AuthService);
  private reproductiveStatus = inject(ReproductiveStatusService);
  private firstWeekPlan = inject(FirstWeekPlanService);
  private homeReproUi = inject(HomeReproductiveUiService);
  private homeJourneyBridge = inject(HomeJourneyBridgeService);

  currentStep = 0;
  answers: { [key: string]: any } = {};
  sessionId: string | null = null;
  isSaving = false;
  isFinishing = false;

  /** Five steps: welcome → intent → last period → optional notifications → personalized summary. */
  steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to NouraCare',
      subtitle: 'Health support that fits your life',
      question:
        'In a few quick steps we will personalize your calendar, reminders, and insights. Nothing here replaces care from your clinician.',
      type: 'radio',
      options: [{ label: 'Continue', value: 'start', icon: '✨' }],
      required: true,
    },
    {
      id: 'pregnancy_status',
      title: 'What would you like help with?',
      subtitle: 'You can change this later',
      question: 'We will ask for one date on the next screen so estimates feel right for you.',
      type: 'radio',
      options: [
        { label: 'Track my cycle', value: 'tracking', icon: '📅' },
        { label: 'Trying to conceive', value: 'trying', icon: '💕' },
        { label: "I'm pregnant", value: 'pregnant', icon: '🤰' },
      ],
      required: true,
    },
    {
      id: 'last_period',
      title: 'When did your last period start?',
      subtitle: 'First day of bleeding',
      question: 'We use this to estimate your next period and fertile days.',
      type: 'date',
      placeholder: 'Select date',
      required: true,
    },
    {
      id: 'notifications',
      title: 'Stay on track',
      subtitle: 'Optional',
      question: 'Gentle reminders for your cycle and check-ins. You are always in control.',
      type: 'notify',
      required: false,
    },
    {
      id: 'personalized_result',
      title: 'You are all set',
      subtitle: 'Estimates only—not medical advice',
      question: '',
      type: 'result',
      required: false,
    },
  ];

  ngOnInit() {
    this.answers = {
      cycle_length: 28,
      period_length: 5,
      notifications: 'no',
    };

    this.sessionId = this.onboardingService.getSessionId();
    if (this.sessionId) {
      this.loadExistingOnboardingData();
    }
  }

  get currentStepData(): OnboardingStep {
    return this.steps[this.currentStep];
  }

  get isPersonalizedResultStep(): boolean {
    return this.currentStepData.id === 'personalized_result';
  }

  getStepTitle(): string {
    const s = this.currentStepData;
    if (s.id === 'last_period' && this.answers['pregnancy_status'] === 'pregnant') {
      return 'First day of your last period (LMP)';
    }
    return s.title;
  }

  getStepSubtitle(): string {
    const s = this.currentStepData;
    if (s.id === 'last_period' && this.answers['pregnancy_status'] === 'pregnant') {
      return 'We use this date to estimate how far along you are.';
    }
    return s.subtitle;
  }

  getStepQuestion(): string {
    const s = this.currentStepData;
    if (s.id === 'last_period' && this.answers['pregnancy_status'] === 'pregnant') {
      return 'Choose the first day of bleeding from your most recent period (not a future date).';
    }
    return s.question;
  }

  getLastPeriodValidationMessage(): string {
    const raw = this.answers['last_period'];
    const iso = normalizeLmpInput(raw);
    if (!iso) {
      return '';
    }
    if (this.answers['pregnancy_status'] === 'pregnant') {
      if (!isCalendarDateNotAfterToday(iso)) {
        return 'That date cannot be in the future.';
      }
      const week = gestationalWeekFromLmp(iso);
      if (week < 4) {
        return 'From this date, pregnancy would be under 4 weeks. Double-check the first day of your last period or confirm with your clinician.';
      }
      if (week > 40) {
        return 'From this date, pregnancy would be over 40 weeks. Double-check your LMP.';
      }
      return '';
    }
    if (!isCalendarDateNotAfterToday(iso)) {
      return 'The start date of your last menstrual period cannot be in the future.';
    }
    return '';
  }

  formatMediumDate(iso: string | null | undefined): string {
    const d = isoDateOnly(typeof iso === 'string' ? iso : '');
    if (!d) return '';
    const parsed = new Date(`${d}T12:00:00`);
    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  getResultHeadline(): string {
    const status = this.answers['pregnancy_status'];
    if (status === 'pregnant') {
      const lmp = this.getEffectiveLmpIsoForStorage();
      const w = lmp ? gestationalWeekFromLmp(lmp) : 0;
      return w > 0 ? `About week ${w}` : 'Pregnancy';
    }
    if (status === 'trying') {
      return 'Fertility snapshot';
    }
    return 'Cycle snapshot';
  }

  getResultSubcopy(): string {
    const status = this.answers['pregnancy_status'];
    if (status === 'pregnant') {
      return 'Based on your last period. Your clinician may use a different dating method.';
    }
    return 'Based on a typical 28-day cycle. You can fine-tune length later in the app.';
  }

  getResultBullets(): { label: string; value: string }[] {
    const lmp = this.getEffectiveLmpIsoForStorage();
    const cl = Number(this.answers['cycle_length']) || 28;
    const status = this.answers['pregnancy_status'];
    if (!lmp) {
      return [];
    }
    if (status === 'pregnant') {
      const edd = addCalendarDaysIso(lmp, 280);
      return [
        { label: 'Last period started', value: this.formatMediumDate(lmp) },
        {
          label: 'Rough due date',
          value: this.formatMediumDate(edd),
        },
      ];
    }
    const next = this.reproductiveStatus.calculateNextPeriod(lmp, cl);
    const fw = this.reproductiveStatus.calculateFertileWindow(lmp, cl);
    const nextIso = next.toISOString().slice(0, 10);
    const startIso = fw.start.toISOString().slice(0, 10);
    const endIso = fw.end.toISOString().slice(0, 10);
    return [
      { label: 'Next period (estimate)', value: this.formatMediumDate(nextIso) },
      {
        label: 'Fertile window (estimate)',
        value: `${this.formatMediumDate(startIso)} – ${this.formatMediumDate(endIso)}`,
      },
    ];
  }

  onNotificationToggle(enabled: boolean): void {
    this.answers['notifications'] = enabled ? 'yes' : 'no';
  }

  get progressPercentage(): number {
    return ((this.currentStep + 1) / this.steps.length) * 100;
  }

  /** Short label for the progress line so steps feel purposeful, not bureaucratic. */
  getStepProgressLabel(stepIndex: number = this.currentStep): string {
    const id = this.steps[stepIndex]?.id;
    const labels: Record<string, string> = {
      welcome: 'Quick intro',
      pregnancy_status: 'Your goal',
      last_period: 'Important date',
      notifications: 'Reminders',
      personalized_result: 'Your snapshot',
    };
    return labels[id ?? ''] ?? `Step ${stepIndex + 1}`;
  }

  /** One tap from welcome: no separate “select card then Continue”. */
  startFromWelcome(): void {
    this.answers['welcome'] = 'start';
    this.nextStep();
  }

  get canProceed(): boolean {
    const step = this.currentStepData;
    if (!step.required) return true;

    // For last period date, check if it's valid (not in future)
    if (step.id === 'last_period' && this.answers[step.id]) {
      const lmp = normalizeLmpInput(this.answers[step.id]);
      return !!lmp && this.isValidLastPeriodDate(lmp);
    }

    return (
      this.answers[step.id] !== undefined &&
      this.answers[step.id] !== null &&
      this.answers[step.id] !== ''
    );
  }

  selectOption(stepId: string, value: any) {
    if (stepId === 'last_period') {
      if (value == null || value === '') {
        delete this.answers[stepId];
        return;
      }
      const normalized = normalizeLmpInput(value);
      if (!normalized) {
        delete this.answers[stepId];
        return;
      }
      if (!this.isValidLastPeriodDate(normalized)) {
        this.showDateValidationError();
        return;
      }
      this.answers[stepId] = normalized;
      if (this.answers['pregnancy_status'] === 'pregnant') {
        this.syncPregnancyWeekFromLmp();
      }
      return;
    }

    this.answers[stepId] = value;
  }

  getMaxDate(): string {
    return new Date().toISOString();
  }

  isValidLastPeriodDate(dateString: string): boolean {
    const iso = normalizeLmpInput(dateString);
    if (!iso) {
      return false;
    }
    if (this.answers['pregnancy_status'] === 'pregnant') {
      if (!isCalendarDateNotAfterToday(iso)) {
        return false;
      }
      const week = gestationalWeekFromLmp(iso);
      return week >= 4 && week <= 40;
    }
    return isCalendarDateNotAfterToday(iso);
  }

  private syncPregnancyWeekFromLmp(): void {
    if (this.answers['pregnancy_status'] !== 'pregnant') {
      return;
    }
    const lmp = normalizeLmpInput(this.answers['last_period']);
    if (!lmp || !this.isValidLastPeriodDate(lmp)) {
      delete this.answers['pregnancy_week'];
      return;
    }
    this.answers['pregnancy_week'] = gestationalWeekFromLmp(lmp);
  }

  /** Canonical LMP (first day of last period), `YYYY-MM-DD`, or null. */
  private getEffectiveLmpIsoForStorage(): string | null {
    return normalizeLmpInput(this.answers['last_period']);
  }

  private async showDateValidationError() {
    const msg =
      this.answers['pregnancy_status'] === 'pregnant'
        ? this.getLastPeriodValidationMessage() ||
          'Please choose a valid first day of your last period (about 4–40 weeks along).'
        : 'The start date of your last menstrual period cannot be in the future. Please select a valid date.';
    const alert = await this.alertController.create({
      header: 'Invalid Date',
      message: msg,
      buttons: ['OK'],
    });

    await alert.present();
  }

  nextStep() {
    if (!this.canProceed) {
      return;
    }
    if (this.currentStepData.id === 'notifications') {
      this.answers['notifications'] = this.answers['notifications'] ?? 'no';
    }
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.saveOnboardingProgress();
    } else {
      this.completeOnboarding();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  skipStep() {
    if (this.currentStepData.id === 'notifications') {
      this.answers['notifications'] = 'no';
    }
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.saveOnboardingProgress();
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
        if (response.data) {
          let healthGoals: unknown[] = [];
          try {
            const parsed = response.data.health_goals
              ? JSON.parse(response.data.health_goals)
              : [];
            healthGoals = Array.isArray(parsed) ? parsed : [];
          } catch {
            healthGoals = [];
          }
          const lmp = normalizeLmpInput(response.data.lmp_date ?? response.data.last_period);
          this.answers = {
            pregnancy_status: response.data.pregnancy_status,
            last_period: lmp ?? undefined,
            cycle_length: response.data.cycle_length,
            period_length: response.data.period_length,
            health_goals: healthGoals,
            notifications: response.data.notifications || 'no',
          };
          if (
            this.answers['pregnancy_status'] === 'pregnant' &&
            this.answers['last_period']
          ) {
            this.syncPregnancyWeekFromLmp();
          }
        }
      },
      error: () => {
        this.onboardingService.clearSessionId();
        this.sessionId = null;
      },
    });
  }

  private buildOnboardingDto(): OnboardingDataDto {
    const lmp = this.getEffectiveLmpIsoForStorage();
    const pregnant = String(this.answers['pregnancy_status'] ?? '').toLowerCase() === 'pregnant';
    return {
      pregnancy_status: this.answers['pregnancy_status'] || 'tracking',
      lmp_date: lmp,
      last_period: lmp,
      cycle_length: this.answers['cycle_length'] || 28,
      period_length: this.answers['period_length'] || 5,
      pregnancy_week: pregnant ? undefined : this.answers['pregnancy_week'] || undefined,
      health_goals: JSON.stringify(this.answers['health_goals'] || []),
      notifications: this.answers['notifications'] || 'no',
    };
  }

  private saveOnboardingProgress() {
    if (this.isSaving) return;

    this.isSaving = true;
    const onboardingData = this.buildOnboardingDto();

    this.onboardingService.saveOnboardingData(onboardingData).subscribe({
      next: (response) => {
        this.sessionId = response.sessionId;
        this.onboardingService.saveSessionId(this.sessionId);
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
        this.showErrorAlert('Failed to save your progress. Please try again.');
      },
    });
  }

  completeOnboarding() {
    if (this.isFinishing) {
      return;
    }
    const reproductivePayload = this.toReproductivePayload();
    this.saveAnswers();

    this.isFinishing = true;
    const onboardingData = this.buildOnboardingDto();

    this.onboardingService.saveOnboardingData(onboardingData).subscribe({
      next: (response) => {
        this.sessionId = response.sessionId;
        this.onboardingService.saveSessionId(this.sessionId);
        const token = this.authService.getAccessToken();
        if (token) {
          this.onboardingService.initializeReproductiveState(reproductivePayload).subscribe({
            next: (dashboard) => {
              const state = this.homeReproUi.synchronizeFromDashboardAndJourney(
                dashboard,
                null,
              );
              this.homeJourneyBridge.pushJourneyStateFromWeekDetail(state);
              this.isFinishing = false;
              this.router.navigate(['/tabs/home']);
            },
            error: () => {
              this.isFinishing = false;
              this.showErrorAlert(
                'Failed to initialize your health profile. Please try again.',
              );
            },
          });
          return;
        }
        this.isFinishing = false;
        this.router.navigate(['/auth/sign-in'], {
          queryParams: { tab: 'register' },
        });
      },
      error: () => {
        this.isFinishing = false;
        this.showErrorAlert('Failed to save your profile. Please try again.');
      },
    });
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
      tryingSince: mappedState === 'planning' ? lmp || undefined : undefined,
      // Pregnant: LMP only — server derives weeks; do not send currentWeek (avoids conflicting inputs).
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

      if (lmp) {
        const w = gestationalWeekFromLmp(lmp);
        this.cycleSettings.setPregnancyWeek(w);
        this.cycleSettings.setPregnancyProgress(Math.min(100, Math.round((w / 40) * 100)));
      }
    } else if (pregnancyStatus === 'postpartum') {
      this.cycleSettings.setUserStatus('Postpartum');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(true);
    } else if (pregnancyStatus === 'trying') {
      this.cycleSettings.setUserStatus('Trying to Conceive');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(false);
    } else {
      this.cycleSettings.setUserStatus('Cycle Tracking');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(false);
    }

    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem(
      'health_goals',
      JSON.stringify(this.answers['health_goals'] || []),
    );
    localStorage.setItem(
      'notifications_enabled',
      this.answers['notifications'] === 'yes' ? 'true' : 'false',
    );

    const lmpOut = this.getEffectiveLmpIsoForStorage();
    const pregnantOut = String(this.answers['pregnancy_status'] ?? '').toLowerCase() === 'pregnant';
    const onboardingData = {
      pregnancy_status: this.answers['pregnancy_status'] || 'tracking',
      lmp_date: lmpOut,
      last_period: lmpOut,
      cycle_length: this.answers['cycle_length'] || 28,
      period_length: this.answers['period_length'] || 5,
      pregnancy_week:
        pregnantOut && lmpOut ? gestationalWeekFromLmp(lmpOut) : this.answers['pregnancy_week'] || undefined,
      health_goals: JSON.stringify(this.answers['health_goals'] || []),
      notifications: this.answers['notifications'] || 'no',
    };
    localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));

    this.onboardingStateService.markOnboardingCompleted();
    this.firstWeekPlan.ensurePlanStarted();
  }
}
