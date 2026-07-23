import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { AlertController, PickerController } from '@ionic/angular';
import { CycleSettingsService } from '@app/shared/services/cycle-settings.service';
import {
  OnboardingService,
  OnboardingDataDto,
  InitializeReproductiveStateDto,
} from '@app/shared/services/onboarding.service';
import { OnboardingStateService } from '@app/shared/services/onboarding-state.service';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { AuthService } from '@app/core/auth/services/auth';
import {
  addCalendarDaysIso,
  gestationalWeekFromLmp,
  isoDateOnly,
  isCalendarDateNotAfterToday,
  lmpIsoFromGestationalWeek1Based,
  normalizeLmpInput,
  utcTodayIsoDateOnly,
} from '@app/shared/utils/pregnancy-lmp.util';
import { mapLocalOnboardingToReproductiveInit } from '@app/shared/utils/onboarding-reproductive.util';
import { ReproductiveStatusService } from '@app/shared/services/reproductive-status.service';
import { FirstWeekPlanService } from '@app/shared/services/first-week-plan.service';
import { HomeReproductiveUiService } from '@app/features/home/services/home-reproductive-ui.service';
import { HomeJourneyBridgeService } from '@app/features/home/services/home-journey-bridge.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { LanguageService } from '@app/shared/services/language.service';
import {
  PeriodDatePickerComponent,
  PeriodDateRange,
} from '@app/shared/ui/period-date-picker/period-date-picker.component';
import { ReproductiveStatusPickerComponent } from '@app/shared/ui/reproductive-status-picker/reproductive-status-picker.component';
import {
  normalizeReproductiveUiStatus,
  uiStatusToApiState,
  uiStatusToHomeStatus,
} from '@app/shared/reproductive-status/reproductive-status.mapper';
import {
  formatRecordedAtDate,
  isPersianAppLanguage,
} from '@app/shared/utils/locale-date-format.util';
import {
  J_MONTHS,
  JALALI_DATE_PICKER_CLASS,
  JALALI_PICKER_MONTH_COL_WIDTH,
  jalaliDaysInMonth,
  jalaliToIsoDate,
  toFa,
} from '@app/shared/utils/jalali-iranian-calendar.util';
import {
  attachJalaliPickerLiveValidation,
  clearJalaliPickerFeedback,
  showJalaliPickerFeedback,
} from '@app/shared/utils/jalali-picker-live-validation.util';
import {
  clearOnboardingProgress,
  readOnboardingProgress,
  writeOnboardingProgress,
} from '@app/core/guards/onboarding-local-storage.util';
import { OnboardingLanguageSheetService } from '@app/shared/services/onboarding-language-sheet.service';
import {
  markOnboardingLanguageConfirmed,
} from '@app/shared/utils/onboarding-language.util';
import { Router } from '@angular/router';

const DEFAULT_PREGNANCY_WEEK = 4;

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  question: string;
  type: 'radio' | 'date' | 'number' | 'select' | 'notify' | 'result';
  options?: {
    labelKey: string;
    value: any;
    icon?: string;
    imageSrc?: string;
  }[];
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
  imports: [
    ...SHARED_STANDALONE_IMPORTS,
    PeriodDatePickerComponent,
    ReproductiveStatusPickerComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OnboardingComponent implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private pickerController = inject(PickerController);
  private cycleSettings = inject(CycleSettingsService);
  private onboardingService = inject(OnboardingService);
  private onboardingStateService = inject(OnboardingStateService);
  readonly authService = inject(AuthService);
  private reproductiveStatus = inject(ReproductiveStatusService);
  private firstWeekPlan = inject(FirstWeekPlanService);
  private homeReproUi = inject(HomeReproductiveUiService);
  private homeJourneyBridge = inject(HomeJourneyBridgeService);
  private translation = inject(TranslationService);
  private languageService = inject(LanguageService);
  private onboardingLanguageSheet = inject(OnboardingLanguageSheetService);
  private cdr = inject(ChangeDetectorRef);

  languageReady = false;

  currentStep = 0;
  answers: { [key: string]: any } = {};
  sessionId: string | null = null;
  isSaving = false;
  isFinishing = false;

  /**
   * Step catalog; the active path is `stepOrder()` (welcome → goal → context → notifications → result).
   */
  private readonly stepById: Record<string, OnboardingStep> = {
    welcome: {
      id: 'welcome',
      title: 'Welcome to DoreHealth',
      subtitle: 'Health support that fits your life',
      question:
        'In a few quick steps we will personalize your calendar, reminders, and insights. Nothing here replaces care from your clinician.',
      type: 'radio',
      options: [{ labelKey: 'onboarding.nav.continue', value: 'start', icon: '✨' }],
      required: true,
    },
    pregnancy_status: {
      id: 'pregnancy_status',
      title: 'Your status',
      subtitle: 'You can update this anytime in your profile.',
      question:
        'Choose the same status options as in your profile. The next step depends on your choice.',
      type: 'radio',
      // Options come from REPRODUCTIVE_STATUS_OPTIONS via app-reproductive-status-picker.
      required: true,
    },
    last_period: {
      id: 'last_period',
      title: 'When did your last period start?',
      subtitle: 'First day of bleeding',
      question: 'We use this to estimate your next period and fertile days.',
      type: 'date',
      placeholder: 'Select date',
      required: true,
    },
    pregnancy_week: {
      id: 'pregnancy_week',
      title: 'How many weeks pregnant are you?',
      subtitle: 'Gestational week (1-based, as your clinician or ultrasound often uses)',
      question:
        'Enter a whole number from 4 to 40. We estimate your due date from this; your care team may use slightly different dating.',
      type: 'number',
      placeholder: 'e.g. 12',
      min: 4,
      max: 40,
      required: true,
    },
    baby_birth_date: {
      id: 'baby_birth_date',
      title: 'When was your baby born?',
      subtitle: 'Approximate is fine',
      question:
        'We use this for postpartum-friendly timing in the app—not as a medical record. Skip fine details if you prefer.',
      type: 'date',
      placeholder: 'Select date',
      required: true,
    },
    notifications: {
      id: 'notifications',
      title: 'Stay on track',
      subtitle: 'Optional',
      question: 'Gentle reminders for your cycle and check-ins. You are always in control.',
      type: 'notify',
      required: false,
    },
    personalized_result: {
      id: 'personalized_result',
      title: 'You are all set',
      subtitle: 'Estimates only—not medical advice',
      question: '',
      type: 'result',
      required: false,
    },
  };

  /** Ordered ids for the current journey (after goal is known, index ≥2 is stable until goal changes). */
  stepOrder(): string[] {
    const ui = normalizeReproductiveUiStatus(this.answers['pregnancy_status']);
    let contextual: string | null = 'last_period';
    if (ui === 'PREGNANT') {
      contextual = 'pregnancy_week';
    } else if (ui === 'POSTPARTUM') {
      // Legacy in-progress drafts only; Profile no longer offers postpartum.
      contextual = 'baby_birth_date';
    } else if (ui === 'MENOPAUSE') {
      contextual = null;
    }
    return contextual
      ? ['welcome', 'pregnancy_status', contextual, 'notifications', 'personalized_result']
      : ['welcome', 'pregnancy_status', 'notifications', 'personalized_result'];
  }

  get totalSteps(): number {
    return this.stepOrder().length;
  }

  ngOnInit() {
    void this.initializeOnboarding();
  }

  private async initializeOnboarding(): Promise<void> {
    await this.ensureOnboardingLanguage();

    this.answers = this.defaultAnswers();
    this.restoreLocalProgress();

    this.sessionId = this.onboardingService.getSessionId();
    if (this.sessionId) {
      this.loadExistingOnboardingData();
    }

    this.languageReady = true;
    this.cdr.markForCheck();
  }

  private async ensureOnboardingLanguage(): Promise<void> {
    const choice = await this.onboardingLanguageSheet.presentIfNeeded();
    if (choice) {
      this.languageService.setLanguage(choice);
      markOnboardingLanguageConfirmed();
    }
  }

  private defaultAnswers(): { [key: string]: any } {
    return {
      // Match picker default highlight (فقط ردیابی چرخه / NOT_PREGNANT).
      pregnancy_status: 'cycle',
      cycle_length: 28,
      period_length: 5,
      notifications: 'no',
    };
  }

  /** Restore step + answers from localStorage (works offline; separate from completed profile). */
  private restoreLocalProgress(): void {
    const snapshot = readOnboardingProgress();
    if (!snapshot) {
      return;
    }
    this.answers = { ...this.defaultAnswers(), ...snapshot.answers };
    const maxStep = Math.max(0, this.totalSteps - 1);
    this.currentStep = Math.max(0, Math.min(snapshot.currentStep, maxStep));
    if (this.isPregnantStatus()) {
      if (this.answers['last_period']) {
        this.syncPregnancyWeekFromLmp();
      } else if (!this.answers['pregnancy_week']) {
        this.applyPregnancyWeek(DEFAULT_PREGNANCY_WEEK);
      }
    }
  }

  private persistLocalProgress(): void {
    writeOnboardingProgress({
      currentStep: this.currentStep,
      answers: { ...this.answers },
      updatedAt: new Date().toISOString(),
    });
  }

  /** When only server payload exists, pick the first incomplete step. */
  private inferStepIndexFromAnswers(): number {
    const order = this.stepOrder();
    if (!this.answers['welcome']) {
      return 0;
    }
    for (let i = 1; i < order.length; i++) {
      const stepId = order[i];
      if (stepId === 'notifications' || stepId === 'personalized_result') {
        continue;
      }
      const value = this.answers[stepId];
      if (value === undefined || value === null || value === '') {
        return i;
      }
    }
    return Math.max(0, order.indexOf('notifications'));
  }

  get currentStepData(): OnboardingStep {
    const id = this.stepOrder()[this.currentStep] ?? 'welcome';
    return this.stepById[id] ?? this.stepById['welcome'];
  }

  get isPersonalizedResultStep(): boolean {
    return this.currentStepData.id === 'personalized_result';
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private tParams(key: string, params: Record<string, string | number>): string {
    return this.translation.translateParams(key, params);
  }

  private stepKeyPrefix(id: string): string {
    const map: Record<string, string> = {
      welcome: 'onboarding.welcome',
      pregnancy_status: 'onboarding.pregnancyStatus',
      last_period: 'onboarding.lastPeriod',
      pregnancy_week: 'onboarding.pregnancyWeek',
      baby_birth_date: 'onboarding.babyBirthDate',
      notifications: 'onboarding.notifications',
      personalized_result: 'onboarding.personalizedResult',
    };
    return map[id] ?? 'onboarding.welcome';
  }

  getOptionLabel(option: { labelKey: string }): string {
    return this.t(option.labelKey);
  }

  getStepTitle(): string {
    // Keep the same title as Profile «وضعیت شما».
    if (this.currentStepData.id === 'pregnancy_status') {
      return this.t('editProfile.experienceTitle');
    }
    return this.t(`${this.stepKeyPrefix(this.currentStepData.id)}.title`);
  }

  getStepSubtitle(): string {
    const s = this.currentStepData;
    if (s.id === 'last_period' && this.isPlanningStatus()) {
      return this.t('onboarding.lastPeriod.subtitleTrying');
    }
    return this.t(`${this.stepKeyPrefix(s.id)}.subtitle`);
  }

  getStepQuestion(): string {
    const s = this.currentStepData;
    if (s.id === 'last_period' && this.isPlanningStatus()) {
      return this.t('onboarding.lastPeriod.questionTrying');
    }
    if (s.id === 'last_period') {
      return this.t('onboarding.lastPeriod.questionDefault');
    }
    return this.t(`${this.stepKeyPrefix(s.id)}.question`);
  }

  /** Same status vocabulary as Profile «وضعیت شما». */
  private reproductiveUiStatus() {
    return normalizeReproductiveUiStatus(this.answers['pregnancy_status']);
  }

  private isPlanningStatus(): boolean {
    return this.reproductiveUiStatus() === 'PLANNING_PREGNANCY';
  }

  private isPregnantStatus(): boolean {
    return this.reproductiveUiStatus() === 'PREGNANT';
  }

  private isPostpartumStatus(): boolean {
    return this.reproductiveUiStatus() === 'POSTPARTUM';
  }

  private isMenopauseStatus(): boolean {
    return this.reproductiveUiStatus() === 'MENOPAUSE';
  }

  /** Picker emits UI keys; store canonical API states shared with Profile. */
  onReproductiveStatusSelected(uiStatus: string): void {
    this.selectOption('pregnancy_status', uiStatusToApiState(uiStatus));
  }

  getLastPeriodValidationMessage(): string {
    const raw = this.answers['last_period'];
    const iso = normalizeLmpInput(raw);
    if (!iso) {
      return '';
    }
    if (!isCalendarDateNotAfterToday(iso)) {
      return this.t('onboarding.validation.lastPeriodFuture');
    }
    return '';
  }

  getBabyBirthValidationMessage(): string {
    const iso = normalizeLmpInput(this.answers['baby_birth_date']);
    if (!iso) return '';
    if (!isCalendarDateNotAfterToday(iso)) {
      return this.t('onboarding.validation.birthFuture');
    }
    const min = this.getBabyBirthMinIso();
    if (iso < min) {
      return this.t('onboarding.validation.birthTooOld');
    }
    return '';
  }

  formatMediumDate(iso: string | null | undefined): string {
    const d = isoDateOnly(typeof iso === 'string' ? iso : '');
    if (!d) return '';
    const parsed = new Date(`${d}T12:00:00`);
    return formatRecordedAtDate(parsed, this.languageService.getCurrentLanguage());
  }

  isPersianLanguage(): boolean {
    return isPersianAppLanguage(this.languageService.getCurrentLanguage());
  }

  get onboardingPeriodLength(): number {
    return Number(this.answers['period_length']) || this.cycleSettings.periodLength() || 5;
  }

  get onboardingCycleLength(): number {
    return Number(this.answers['cycle_length']) || this.cycleSettings.cycleLength() || 28;
  }

  onLastPeriodRangeSelected(range: PeriodDateRange): void {
    const d = range.startDate;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.selectOption('last_period', iso);
  }

  async openBabyBirthJalaliPicker(): Promise<void> {
    const seedIso =
      normalizeLmpInput(this.answers['baby_birth_date']) || utcTodayIsoDateOnly();
    const jalaali = await import('jalaali-js');
    const [gy, gm, gd] = seedIso.split('-').map((n) => parseInt(n, 10));
    const initial = jalaali.toJalaali(gy, gm, gd);

    const minIso = this.getBabyBirthMinIso();
    const maxIso = this.getBabyBirthMaxIso();
    const [minGy, minGm, minGd] = minIso.split('-').map((n) => parseInt(n, 10));
    const minJ = jalaali.toJalaali(minGy, minGm, minGd);
    const [maxGy, maxGm, maxGd] = maxIso.split('-').map((n) => parseInt(n, 10));
    const maxJ = jalaali.toJalaali(maxGy, maxGm, maxGd);
    const years = Array.from(
      { length: maxJ.jy - minJ.jy + 1 },
      (_, i) => minJ.jy + i,
    );

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

    const picker = await this.pickerController.create({
      cssClass: JALALI_DATE_PICKER_CLASS,
      columns: [dayCol, monthCol, yearCol],
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('reproductiveStatus.confirm'),
          handler: (value) => {
            const iso = jalaliToIsoDate(
              value.year.value,
              value.month.value,
              value.day.value,
            );
            const check = this.validateBabyBirthIso(iso);
            if (!check.valid) {
              showJalaliPickerFeedback(picker, check.errorKey, (key) => this.t(key));
              return false;
            }
            clearJalaliPickerFeedback(picker);
            this.selectOption('baby_birth_date', check.iso);
            return true;
          },
        },
      ],
    });

    await picker.present();

    attachJalaliPickerLiveValidation(picker, {
      validate: (iso) => this.validateBabyBirthIso(iso),
      translate: (key) => this.t(key),
    });
  }

  private validateBabyBirthIso(iso: string) {
    const normalized = normalizeLmpInput(iso);
    if (!normalized) {
      return { valid: false as const, errorKey: 'onboarding.validation.adjustDate' };
    }
    if (!isCalendarDateNotAfterToday(normalized)) {
      return { valid: false as const, errorKey: 'onboarding.validation.birthFuture' };
    }
    if (normalized < this.getBabyBirthMinIso()) {
      return { valid: false as const, errorKey: 'onboarding.validation.birthTooOld' };
    }
    return { valid: true as const, iso: normalized };
  }

  /** Whole weeks since `birthIso` (date-only) through today (UTC civil days). */
  private weeksSinceBirthApprox(birthIso: string): number {
    const b = isoDateOnly(birthIso);
    const t = utcTodayIsoDateOnly();
    if (!b) return 0;
    const [y1, m1, d1] = b.split('-').map((x) => Number(x));
    const [y2, m2, d2] = t.split('-').map((x) => Number(x));
    const u1 = Date.UTC(y1, m1 - 1, d1);
    const u2 = Date.UTC(y2, m2 - 1, d2);
    const days = Math.floor((u2 - u1) / 86400000);
    return Math.max(0, Math.floor(days / 7));
  }

  getBabyBirthMinIso(): string {
    return addCalendarDaysIso(utcTodayIsoDateOnly(), -800);
  }

  getBabyBirthMaxIso(): string {
    return utcTodayIsoDateOnly();
  }

  getResultHeadline(): string {
    if (this.isPregnantStatus()) {
      const w = Number(this.answers['pregnancy_week']) || 0;
      return w > 0
        ? this.tParams('onboarding.result.headline.pregnant', { week: w })
        : this.t('onboarding.result.headline.pregnantFallback');
    }
    if (this.isPlanningStatus()) {
      return this.t('onboarding.result.headline.trying');
    }
    if (this.isPostpartumStatus()) {
      return this.t('onboarding.result.headline.postpartum');
    }
    if (this.isMenopauseStatus()) {
      return this.t('onboarding.result.headline.menopause');
    }
    return this.t('onboarding.result.headline.cycle');
  }

  getResultSubcopy(): string {
    if (this.isPregnantStatus()) {
      return this.t('onboarding.result.subcopy.pregnant');
    }
    if (this.isPostpartumStatus()) {
      return this.t('onboarding.result.subcopy.postpartum');
    }
    if (this.isMenopauseStatus()) {
      return this.t('onboarding.result.subcopy.menopause');
    }
    return this.t('onboarding.result.subcopy.default');
  }

  getResultBullets(): { label: string; value: string }[] {
    const lmp = this.getEffectiveLmpIsoForStorage();
    const cl = Number(this.answers['cycle_length']) || 28;
    if (this.isPostpartumStatus()) {
      const birth = normalizeLmpInput(this.answers['baby_birth_date']);
      if (!birth) {
        return [];
      }
      const weeks = this.weeksSinceBirthApprox(birth);
      return [
        {
          label: this.t('onboarding.result.bullet.babyBirthDate'),
          value: this.formatMediumDate(birth),
        },
        {
          label: this.t('onboarding.result.bullet.timeSinceBirth'),
          value: `${weeks} wk`,
        },
      ];
    }
    if (this.isMenopauseStatus()) {
      return [];
    }
    if (!lmp) {
      return [];
    }
    if (this.isPregnantStatus()) {
      const edd = addCalendarDaysIso(lmp, 280);
      return [
        {
          label: this.t('onboarding.result.bullet.estimatedLmp'),
          value: this.formatMediumDate(lmp),
        },
        {
          label: this.t('onboarding.result.bullet.roughDueDate'),
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
      {
        label: this.t('onboarding.result.bullet.nextPeriod'),
        value: this.formatMediumDate(nextIso),
      },
      {
        label: this.t('onboarding.result.bullet.fertileWindow'),
        value: `${this.formatMediumDate(startIso)} – ${this.formatMediumDate(endIso)}`,
      },
    ];
  }

  onNotificationToggle(enabled: boolean): void {
    this.answers['notifications'] = enabled ? 'yes' : 'no';
    this.persistLocalProgress();
  }

  get progressPercentage(): number {
    return ((this.currentStep + 1) / this.totalSteps) * 100;
  }

  /** Ionic icon for the active step (visual anchor in the hero). */
  getStepIcon(stepId: string = this.currentStepData.id): string {
    const icons: Record<string, string> = {
      welcome: 'sparkles-outline',
      pregnancy_status: 'heart-outline',
      last_period: 'calendar-outline',
      pregnancy_week: 'body-outline',
      baby_birth_date: 'happy-outline',
      notifications: 'notifications-outline',
      personalized_result: 'checkmark-done-outline',
    };
    return icons[stepId] ?? 'ellipse-outline';
  }

  getFormattedAnswerDate(stepId: string): string | null {
    const raw = this.answers[stepId];
    if (!raw) {
      return null;
    }
    const iso = normalizeLmpInput(raw);
    return iso ? this.formatMediumDate(iso) : null;
  }

  adjustPregnancyWeek(delta: number): void {
    const min = this.stepById['pregnancy_week'].min ?? 4;
    const max = this.stepById['pregnancy_week'].max ?? 40;
    const current = Number(this.answers['pregnancy_week']);
    const base = Number.isFinite(current) ? current : min;
    const next = Math.min(max, Math.max(min, base + delta));
    this.selectOption('pregnancy_week', next);
  }

  canDecrementPregnancyWeek(): boolean {
    const n = Number(this.answers['pregnancy_week']);
    if (!Number.isFinite(n)) {
      return false;
    }
    return n > (this.stepById['pregnancy_week'].min ?? 4);
  }

  canIncrementPregnancyWeek(): boolean {
    const n = Number(this.answers['pregnancy_week']);
    const max = this.stepById['pregnancy_week'].max ?? 40;
    if (!Number.isFinite(n)) {
      return true;
    }
    return n < max;
  }

  /** Indices for segmented progress dots. */
  get stepDotIndices(): number[] {
    return Array.from({ length: this.totalSteps }, (_, i) => i);
  }

  isStepDotComplete(index: number): boolean {
    return index < this.currentStep;
  }

  isStepDotActive(index: number): boolean {
    return index === this.currentStep;
  }

  /** Short label for the progress line so steps feel purposeful, not bureaucratic. */
  getStepProgressLabel(stepIndex: number = this.currentStep): string {
    const id = this.stepOrder()[stepIndex];
    const labels: Record<string, string> = {
      welcome: 'onboarding.progress.quickIntro',
      pregnancy_status: 'onboarding.progress.yourGoal',
      last_period: 'onboarding.progress.cycleDate',
      pregnancy_week: 'onboarding.progress.pregnancyWeek',
      baby_birth_date: 'onboarding.progress.birthDate',
      notifications: 'onboarding.progress.reminders',
      personalized_result: 'onboarding.progress.yourSnapshot',
    };
    const key = labels[id ?? ''];
    return key ? this.t(key) : `Step ${stepIndex + 1}`;
  }

  /** One tap from welcome: no separate “select card then Continue”. */
  startFromWelcome(): void {
    this.answers['welcome'] = 'start';
    this.nextStep();
  }

  get canProceed(): boolean {
    const step = this.currentStepData;
    if (!step.required) return true;

    if (step.id === 'last_period' && this.answers[step.id]) {
      const lmp = normalizeLmpInput(this.answers[step.id]);
      return !!lmp && this.isValidLastPeriodDate(lmp);
    }

    if (step.id === 'baby_birth_date' && this.answers[step.id]) {
      const iso = normalizeLmpInput(this.answers[step.id]);
      return !!iso && this.isValidBabyBirthDate(iso);
    }

    if (step.id === 'pregnancy_week') {
      const n = Number(this.answers['pregnancy_week']);
      return Number.isInteger(n) && n >= (step.min ?? 4) && n <= (step.max ?? 40);
    }

    return (
      this.answers[step.id] !== undefined &&
      this.answers[step.id] !== null &&
      this.answers[step.id] !== ''
    );
  }

  selectOption(stepId: string, value: any) {
    if (stepId === 'pregnancy_status') {
      const next = uiStatusToApiState(value);
      const prev = this.answers['pregnancy_status'];
      if (prev !== next) {
        delete this.answers['last_period'];
        delete this.answers['pregnancy_week'];
        delete this.answers['baby_birth_date'];
      }
      this.answers[stepId] = next;
      if (next === 'pregnant' && !this.answers['pregnancy_week']) {
        this.applyPregnancyWeek(DEFAULT_PREGNANCY_WEEK);
        return;
      }
      this.persistLocalProgress();
      return;
    }

    if (stepId === 'pregnancy_week') {
      if (value === '' || value == null) {
        delete this.answers['pregnancy_week'];
        delete this.answers['last_period'];
        this.persistLocalProgress();
        return;
      }
      this.applyPregnancyWeek(Math.floor(Number(value)));
      return;
    }

    if (stepId === 'last_period') {
      if (value == null || value === '') {
        delete this.answers[stepId];
        this.persistLocalProgress();
        return;
      }
      const normalized = normalizeLmpInput(value);
      if (!normalized) {
        delete this.answers[stepId];
        this.persistLocalProgress();
        return;
      }
      if (!this.isValidLastPeriodDate(normalized)) {
        this.showDateValidationError();
        return;
      }
      this.answers[stepId] = normalized;
      this.persistLocalProgress();
      return;
    }

    if (stepId === 'baby_birth_date') {
      if (value == null || value === '') {
        delete this.answers[stepId];
        this.persistLocalProgress();
        return;
      }
      const normalized = normalizeLmpInput(value);
      if (!normalized) {
        delete this.answers[stepId];
        this.persistLocalProgress();
        return;
      }
      if (!this.isValidBabyBirthDate(normalized)) {
        this.showBabyBirthValidationError();
        return;
      }
      this.answers[stepId] = normalized;
      this.persistLocalProgress();
      return;
    }

    this.answers[stepId] = value;
    this.persistLocalProgress();
  }

  isValidLastPeriodDate(dateString: string): boolean {
    const iso = normalizeLmpInput(dateString);
    if (!iso) {
      return false;
    }
    if (this.isPregnantStatus()) {
      if (!isCalendarDateNotAfterToday(iso)) {
        return false;
      }
      const week = gestationalWeekFromLmp(iso);
      return week >= 4 && week <= 40;
    }
    return isCalendarDateNotAfterToday(iso);
  }

  /** Postpartum baby birth: on or before today, and not unreasonably far in the past. */
  isValidBabyBirthDate(isoDate: string): boolean {
    const iso = normalizeLmpInput(isoDate);
    if (!iso) {
      return false;
    }
    if (!isCalendarDateNotAfterToday(iso)) {
      return false;
    }
    return iso >= this.getBabyBirthMinIso();
  }

  private applyPregnancyWeek(value: number): void {
    const max = this.stepById['pregnancy_week'].max ?? 40;
    const min = this.stepById['pregnancy_week'].min ?? DEFAULT_PREGNANCY_WEEK;
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < min || n > max) {
      delete this.answers['pregnancy_week'];
      delete this.answers['last_period'];
      this.persistLocalProgress();
      return;
    }
    this.answers['pregnancy_week'] = n;
    const lmp = lmpIsoFromGestationalWeek1Based(n);
    if (!lmp || !this.isValidLastPeriodDate(lmp)) {
      delete this.answers['last_period'];
      this.persistLocalProgress();
      return;
    }
    this.answers['last_period'] = lmp;
    this.syncPregnancyWeekFromLmp();
    this.persistLocalProgress();
  }

  private syncPregnancyWeekFromLmp(): void {
    if (!this.isPregnantStatus()) {
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
    if (this.isPostpartumStatus() || this.isMenopauseStatus()) {
      return null;
    }
    return normalizeLmpInput(this.answers['last_period']);
  }

  private async showDateValidationError() {
    const msg =
      this.getLastPeriodValidationMessage() ||
      this.t('onboarding.alert.invalidDateFallback');
    const alert = await this.alertController.create({
      header: this.t('onboarding.alert.invalidDateHeader'),
      message: msg,
      buttons: [this.t('common.ok')],
    });

    await alert.present();
  }

  private async showBabyBirthValidationError() {
    const msg =
      this.getBabyBirthValidationMessage() ||
      this.t('onboarding.alert.invalidBirthFallback');
    const alert = await this.alertController.create({
      header: this.t('onboarding.alert.invalidBirthHeader'),
      message: msg,
      buttons: [this.t('common.ok')],
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
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.saveOnboardingProgress();
    } else {
      this.completeOnboarding();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.persistLocalProgress();
    }
  }

  skipStep() {
    if (this.currentStepData.id === 'notifications') {
      this.answers['notifications'] = 'no';
    }
    if (this.currentStep < this.totalSteps - 1) {
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
          this.applyServerOnboardingData(response.data);
        }
      },
      error: () => {
        this.onboardingService.clearSessionId();
        this.sessionId = null;
      },
    });
  }

  private applyServerOnboardingData(data: OnboardingDataDto): void {
    let healthGoals: unknown[] = [];
    try {
      const parsed = data.health_goals ? JSON.parse(data.health_goals) : [];
      healthGoals = Array.isArray(parsed) ? parsed : [];
    } catch {
      healthGoals = [];
    }
    const lmp = normalizeLmpInput(data.lmp_date ?? data.last_period);
    const serverAnswers: { [key: string]: unknown } = {
      pregnancy_status: data.pregnancy_status,
      last_period: lmp ?? undefined,
      cycle_length: data.cycle_length,
      period_length: data.period_length,
      health_goals: healthGoals,
      notifications: data.notifications || 'no',
    };
    if (data.pregnancy_week != null) {
      serverAnswers['pregnancy_week'] = data.pregnancy_week;
    }

    const local = readOnboardingProgress();
    if (local) {
      this.answers = {
        ...this.defaultAnswers(),
        ...serverAnswers,
        ...local.answers,
      };
      const maxStep = Math.max(0, this.totalSteps - 1);
      this.currentStep = Math.max(0, Math.min(local.currentStep, maxStep));
    } else {
      this.answers = { ...this.defaultAnswers(), ...serverAnswers };
      if (this.answers['welcome']) {
        this.currentStep = this.inferStepIndexFromAnswers();
      }
      this.persistLocalProgress();
    }

    if (this.isPregnantStatus()) {
      if (this.answers['last_period']) {
        this.syncPregnancyWeekFromLmp();
      } else if (!this.answers['pregnancy_week']) {
        this.applyPregnancyWeek(DEFAULT_PREGNANCY_WEEK);
      }
    }
  }

  private buildOnboardingDto(): OnboardingDataDto {
    const lmp = this.getEffectiveLmpIsoForStorage();
    const pregnant = this.isPregnantStatus();
    const pregnancyWeek =
      pregnant && this.answers['pregnancy_week'] != null
        ? Number(this.answers['pregnancy_week'])
        : pregnant && lmp
          ? gestationalWeekFromLmp(lmp)
          : undefined;
    return {
      pregnancy_status: this.answers['pregnancy_status'] || 'cycle',
      lmp_date: lmp,
      last_period: lmp,
      cycle_length: this.answers['cycle_length'] || 28,
      period_length: this.answers['period_length'] || 5,
      pregnancy_week: pregnancyWeek,
      health_goals: JSON.stringify(this.answers['health_goals'] || []),
      notifications: this.answers['notifications'] || 'no',
    };
  }

  private saveOnboardingProgress() {
    this.persistLocalProgress();
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
    const token = this.authService.getAccessToken();

    const finishLocally = () => {
      this.isFinishing = false;
      if (token) {
        this.router.navigate(['/tabs/home']);
      } else {
        // Continue-with-email: unknown emails are auto-registered + OTP on sign-in.
        this.router.navigate(['/auth/sign-in']);
      }
    };

    this.onboardingService.saveOnboardingData(this.buildOnboardingDto()).subscribe({
      next: (response) => {
        this.sessionId = response.sessionId;
        this.onboardingService.saveSessionId(this.sessionId);
      },
      error: () => {
        /* Local profile already saved in saveAnswers(). */
      },
    });

    if (token) {
      this.onboardingService.initializeReproductiveState(reproductivePayload).subscribe({
        next: (dashboard) => {
          const state = this.homeReproUi.synchronizeFromDashboardAndJourney(
            dashboard,
            null,
          );
          this.homeJourneyBridge.pushJourneyStateFromWeekDetail(state);
          finishLocally();
        },
        error: () => {
          finishLocally();
        },
      });
      return;
    }

    finishLocally();
  }

  private toReproductivePayload(): InitializeReproductiveStateDto {
    const payload = mapLocalOnboardingToReproductiveInit({
      pregnancy_status: this.answers['pregnancy_status'],
      lmp_date: this.getEffectiveLmpIsoForStorage(),
      last_period: this.getEffectiveLmpIsoForStorage(),
      cycle_length: this.answers['cycle_length'],
      pregnancy_week: this.answers['pregnancy_week'],
    });
    return (
      payload ?? {
        state: 'cycle',
      }
    );
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

    // Save reproductive status (same set as Profile «وضعیت شما»)
    const ui = this.reproductiveUiStatus();
    const homeStatus = uiStatusToHomeStatus(ui);
    this.cycleSettings.setUserStatus(homeStatus);
    this.cycleSettings.setPregnancyStatus(ui === 'PREGNANT');
    this.cycleSettings.setPostpartumStatus(ui === 'POSTPARTUM');

    if (ui === 'PREGNANT' && lmp) {
      const w = gestationalWeekFromLmp(lmp);
      this.cycleSettings.setPregnancyWeek(w);
      this.cycleSettings.setPregnancyProgress(Math.min(100, Math.round((w / 40) * 100)));
    } else if (ui === 'MENOPAUSE') {
      this.cycleSettings.applyMenopauseHomeMode('perimenopause');
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
    const pregnantOut = this.isPregnantStatus();
    const babyBirth = normalizeLmpInput(this.answers['baby_birth_date']);
    const onboardingData = {
      pregnancy_status: this.answers['pregnancy_status'] || 'cycle',
      lmp_date: lmpOut,
      last_period: lmpOut,
      cycle_length: this.answers['cycle_length'] || 28,
      period_length: this.answers['period_length'] || 5,
      pregnancy_week:
        pregnantOut && lmpOut ? gestationalWeekFromLmp(lmpOut) : this.answers['pregnancy_week'] || undefined,
      baby_birth_date: babyBirth ?? undefined,
      health_goals: JSON.stringify(this.answers['health_goals'] || []),
      notifications: this.answers['notifications'] || 'no',
    };
    localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));

    clearOnboardingProgress();
    this.onboardingStateService.markOnboardingCompleted();
    this.firstWeekPlan.ensurePlanStarted();
  }
}
