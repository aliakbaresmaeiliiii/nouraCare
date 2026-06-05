import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  ElementRef,
  HostListener,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { firstValueFrom, of, Subscription } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { AuthService } from '../auth/services/auth';
import { CirclePeriodChart } from '../shared/components/circle-period-chart/circle-period-chart';
import { DailyInsightsStoryModalComponent } from '../shared/components/daily-insights-story-modal/daily-insights-story-modal.component';
import { FertilityOverviewSheetComponent } from '../shared/components/fertility-overview-sheet/fertility-overview-sheet.component';
import {
  FertilityResults,
  FertilityResultsModalComponent,
} from '../shared/components/fertility-results-modal/fertility-results-modal.component';
import {
  PregnancyResults,
  PregnancyResultsModalComponent,
} from '../shared/components/pregnancy-results-modal/pregnancy-results-modal.component';
import { PregnancySetupSheetComponent } from '../shared/components/pregnancy-setup-sheet/pregnancy-setup-sheet.component';
import { getAllSymptoms } from '../shared/constants/symptoms-config';
import type { UserInfo } from '../shared/interfaces/user-info-api.interface';
import type { DailyInsightTopic } from '../shared/models/daily-insight-topic.model';
import { SymptomsDto } from '../shared/models/symptoms.dto';
import {
  pregnancyWeekIllustrationAlt,
  pregnancyWeekIllustrationUrl,
} from '../shared/pregnancy-week-illustration';
import {
  BabyDevelopmentService,
  BabySizeData,
} from '../shared/services/baby-development.service';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { LanguageService } from '../shared/services/language.service';
import { MessageService } from '../shared/services/message.service';
import {
  OnboardingService,
  type DashboardCyclePhaseGuide,
  type DashboardCyclePhaseGuideCard,
  type InitializeReproductiveStateDto,
} from '../shared/services/onboarding.service';
import { PeriodCycleStateService } from '../shared/services/period-cycle-state.service';
import { TrackDataService } from '../shared/services/track-data.service';
import { TranslationService } from '../shared/services/translation.service';
import { UserInfoService } from '../shared/services/user-info.service';
import {
  HomeFacadeService,
  HomeUnauthenticatedError,
} from './services/home-facade.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { pregnancyDashboardInsightFromWeek } from '../shared/utils/pregnancy-dashboard-insight.util';
import {
  gestationalWeekFromLmp,
  isoDateOnly,
  normalizeLmpInput,
} from '../shared/utils/pregnancy-lmp.util';
import { formatLocalizedNumber } from '../shared/utils/locale-date-format.util';
import {
  getBabyDevelopmentFactForWeek,
  getBabyFunFactForWeek,
} from './data/home-baby-week-copy';
import { HOME_POSTPARTUM_WEEK_SAMPLES } from './data/home-postpartum-sample.data';
import { HomeDataService } from './services/home-data.service';
import { HomeJourneyBridgeService } from './services/home-journey-bridge.service';
import {
  HomeReproductiveUiService,
  type HomePageJourneyState,
} from './services/home-reproductive-ui.service';
import { ReproductiveStatusService } from '../shared/services/reproductive-status.service';

interface PregnancyFeatureSlide {
  id: 'baby-size' | 'fun-fact' | 'development' | 'countdown';
  variant: 'rose' | 'violet' | 'teal' | 'amber';
  eyebrowKey: string;
  eyebrowParams?: Record<string, string | number>;
  headline: string;
  body: string;
  footnoteKey?: string;
  footnoteParams?: Record<string, string | number>;
  ionIcon: string;
  imageUrl?: string | null;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', './home-pregnancy.styles.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, CirclePeriodChart],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class HomeComponent implements OnInit, OnDestroy, ViewWillEnter {
  private cycleSettings = inject(CycleSettingsService);
  private babyDevelopmentService = inject(BabyDevelopmentService);
  private userInfoService = inject(UserInfoService);
  private homeFacade = inject(HomeFacadeService);
  private authService = inject(AuthService);
  private onboardingService = inject(OnboardingService);
  private homeReproUi = inject(HomeReproductiveUiService);
  private homeJourneyBridge = inject(HomeJourneyBridgeService);
  private homeData = inject(HomeDataService);
  private periodCycleState = inject(PeriodCycleStateService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly reproductiveStatusService = inject(
    ReproductiveStatusService
  );
  private langChangeSub?: Subscription;

  /** i18n with optional {{var}} replacement (Persian digits when language is `fa`). */
  private tr(key: string, vars?: Record<string, string | number>): string {
    if (vars) {
      return this.translation.translateParams(key, vars);
    }
    return this.translation.translate(key);
  }

  /** Returns null when the translation key is missing. */
  private trOrNull(
    key: string,
    vars?: Record<string, string | number>,
  ): string | null {
    const text = vars ? this.translation.translateParams(key, vars) : this.translation.translate(key);
    return text === key ? null : text;
  }

  private dateLocaleTag(): string {
    const lang = this.languageService.getCurrentLanguage();
    if (lang === 'fa') return 'fa-IR';
    if (lang === 'zh') return 'zh-CN';
    if (lang === 'ms') return 'ms-MY';
    return 'en-US';
  }

  private trackDataService = inject(TrackDataService);
  @ViewChild(CirclePeriodChart) periodChart!: CirclePeriodChart;
  @ViewChild('pregnancyCalendarScroll', { read: ElementRef })
  pregnancyCalendarScroll?: ElementRef<HTMLElement>;
  @ViewChild('pregnancyConnectWrapper', { read: ElementRef })
  pregnancyConnectWrapper?: ElementRef<HTMLElement>;

  /**
   * SVG overlay: tiny curved stroke from hero disk → selected calendar day column (wrapper-local px).
   * Arrow at the calendar end; anchors use the full day cell, not the date numeral alone.
   */
  pregnancyConnector: {
    w: number;
    h: number;
    pathD: string;
  } | null = null;

  /** Unique fragment id for SVG marker-end (per component instance). */
  readonly pregnancyConnectorMarkerId = `ph-arr-${Math.random()
    .toString(36)
    .slice(2, 11)}`;

  /** Unique id for pregnancy hero ring gradient (per instance). */
  readonly pregnancyHeroRingGradId = `ph-ring-${Math.random()
    .toString(36)
    .slice(2, 11)}`;

  /** Matches SVG viewBox circle `r` for stroke-dashoffset math. */
  private readonly pregnancyHeroRingRadius = 46;

  private pregnancyConnectorRafGen = 0;
  private pregnancyConnectorScrollTimer: ReturnType<typeof setTimeout> | null =
    null;

  /** Calendar: when set, hero / insights reflect this calendar day (not after today). */
  pregnancyCalendarViewDate: Date | null = null;
  pregnancyCalendarSelectedIsoKey: string | null = null;

  private readonly pregnancyCalWeeksPast = 10;
  private readonly pregnancyCalWeeksFuture = 10;

  /** Matches cycle settings / week-detail usable range. */
  /** 1-based gestational week; calendar taps limited to typical clinical follow-up window. */
  private readonly pregnancyCalendarMinWeek = 4;
  private readonly pregnancyCalendarMaxWeek = 40;

  welcomeMessage: string = '';
  dailyMessage: string = '';
  userName: string = 'Ali'; // This would come from your user service

  // User Status and Progress
  userStatus: string = 'Not Set'; // Default state
  isPregnant = signal<boolean>(false); // Set to false by default
  isPostpartum: boolean = false;

  // Cycle tracking
  currentCycleDay: number = 0;
  currentCycleLength: number = 28;
  periodStartDate: Date | null = null;
  /** Bound to cycle chart — updates when dashboard/profile sync writes cycle settings. */
  lastPeriodStartIso: string | null = null;
  periodLength: number = 5;
  pregnancyWeek: number = 0;
  pregnancyProgress: number = 0;
  /** 0–6 (day within current pregnancy week), from dashboard. */
  pregnancyDayInWeek = 0;
  needsPregnancyInput = false;
  dashboardPregnancyTips: string[] = [];
  /** From dashboard `insight` when pregnant; may be filled locally if API omits it. */
  dashboardPregnancyInsight: string | null = null;
  /** Cycle/planning dashboard fields from PATCH /me/state or GET dashboard. */
  dashboardCycleDay: number | null = null;
  dashboardCycleLength: number | null = null;
  dashboardNextPeriodDate: Date | null = null;
  dashboardOvulationDate: string | null = null;
  dashboardFertileWindow: { start: string; end: string } | null = null;
  dashboardCycleInsight: string | null = null;
  dashboardPhaseGuide: DashboardCyclePhaseGuide | null = null;
  dashboardCycleTips: string[] = [];
  private isPromotingOnboardingPregnancy = false;

  // Dynamic baby size data - now computed from service
  get babySize(): string {
    const currentBaby = this.babyDevelopmentService.getCurrentBabySize();
    return currentBaby?.size || 'Lime 🍋';
  }

  get babyWeight(): string {
    const currentBaby = this.babyDevelopmentService.getCurrentBabySize();
    return currentBaby?.weight || '45g';
  }

  get babyDescription(): string {
    const currentBaby = this.babyDevelopmentService.getCurrentBabySize();
    return currentBaby?.description || 'Zesty lime size';
  }

  // Pregnancy tracker properties
  pregnancyStartDate: string = '';
  pregnancyDays: number = 84; // 12 weeks * 7 days
  minDate: string = '2023-01-01';
  maxDate: string = '2025-12-31';
  currentWeekOffset: number = 0; // For scrolling weeks

  // Postpartum tracking
  postpartumWeek: number = 1;
  babyAge: string = '1 week old';
  postpartumBabyWeight: string = '3.2kg';
  postpartumBabyLength: string = '50cm';
  feedingMethod: string = 'Breastfeeding';
  sleepPattern: string = 'Every 2-3 hours';

  postpartumData = HOME_POSTPARTUM_WEEK_SAMPLES;

  // Baby size data is now managed by BabyDevelopmentService
  // Access via: this.babyDevelopmentService.getAllBabySizeData()

  // Quick Stats
  cycleDay: number = 14;
  temperature: number = 36.8;
  mood: string = 'Happy';

  // Appointments
  upcomingAppointments: any[] = [
    {
      day: '15',
      month: 'Dec',
      title: 'Prenatal Checkup',
      time: '10:00 AM',
      doctor: 'Dr. Sarah Johnson',
    },
    {
      day: '22',
      month: 'Dec',
      title: 'Ultrasound',
      time: '2:30 PM',
      doctor: 'Dr. Emily Rodriguez',
    },
  ];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private messageService: MessageService
  ) {
    // Reacts when profile/week-detail pushes savedJourneyFromWeekDetail — works when ionViewWillEnter does not run.
    effect(() => {
      if (!this.authService.getAccessToken()) {
        return;
      }
      // Subscribe to pending profile/week-detail pushes.
      this.homeJourneyBridge.savedJourneyFromWeekDetail();
      this.homeJourneyBridge.applySavedJourneyIfPending((state) => {
        this.applyJourneyStateToView(state);
        this.cdr.markForCheck();
        this.ngZone.run(() => this.runPeriodChartRefresh());
      });
    });

    // Re-sync home + ring when period is logged locally (cycle calendar, picker, profile).
    effect(() => {
      this.cycleSettings.lastPeriodStartDate();
      this.cycleSettings.cycleLength();
      this.cycleSettings.periodLength();
      this.cycleSettings.selectedCycleViewDate();
      this.periodCycleState.periodStartIso();
      this.ngZone.run(() => {
        this.syncLocalCycleViewFromStore();
        this.cdr.markForCheck();
        this.runPeriodChartRefresh();
      });
    });
  }

  ngOnInit() {
    this.langChangeSub = this.languageService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
    this.syncLocalCycleViewFromStore();
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }

  /**
   * Load persisted user status and period data from CycleSettingsService
   */
  private loadPersistedData() {
    this.syncLocalCycleViewFromStore();
  }

  /** Apply shared cycle store → home fields so templates update without a full page reload. */
  private syncLocalCycleViewFromStore(): void {
    // Load user status
    this.userStatus = this.cycleSettings.userStatus();
    this.isPregnant.set(this.cycleSettings.isPregnant());
    this.isPostpartum = this.cycleSettings.isPostpartum();
    // Load pregnancy data
    this.pregnancyWeek = this.cycleSettings.pregnancyWeek();
    this.pregnancyProgress = this.cycleSettings.pregnancyProgress();

    // Load period data
    const lastPeriodStart = this.cycleSettings.lastPeriodStartDate();
    if (lastPeriodStart) {
      const day = lastPeriodStart.includes('T')
        ? lastPeriodStart.split('T')[0]
        : lastPeriodStart.slice(0, 10);
      this.periodStartDate = new Date(`${day}T12:00:00`);
      this.lastPeriodStartIso = day;
      this.updateCycleDay();
    } else {
      this.periodStartDate = null;
      this.lastPeriodStartIso = null;
      this.currentCycleDay = 0;
    }

    // Load cycle settings
    this.currentCycleLength = this.cycleSettings.cycleLength();
    this.periodLength = this.cycleSettings.periodLength();

    // Baby development data is automatically loaded by the service
    // and will be computed based on the current pregnancy week
  }

  /**
   * Check if user has completed onboarding and set appropriate status
   */
  private checkOnboardingStatus() {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    const onboardingData = localStorage.getItem('onboarding_data');
  
    if (onboardingCompleted !== 'true' || !onboardingData) return;
  
    try {
      const data = JSON.parse(onboardingData);
      
      // 1. Handle Status-Specific logic
      const statusHandlers: Record<string, () => void> = {
        pregnant: () => this.handlePregnant(data),
        postpartum: () => this.handlePostpartum(data),
        default: () => this.handleTryingToConceive()
      };
  
      const handler = statusHandlers[data.pregnancy_status] || statusHandlers['default'];
      handler();
  
      // 2. Handle Common Settings (Cycles/Periods)
      this.updateCommonCycleSettings(data);
      
    } catch (error) {
      console.error('Error parsing onboarding data:', error);
    }
  }
  
  private handlePregnant(data: any) {
    this.userStatus = 'Pregnant';
    this.isPregnant.set(true);
    this.isPostpartum = false;
  
    const lmp = normalizeLmpInput(data.lmp_date ?? data.last_period);
    if (lmp) {
      this.calculatePregnancyMetrics(lmp);
    }
  
    this.cycleSettings.setUserStatus('Pregnant');
    this.cycleSettings.setPostpartumStatus(false);
  }
  
  private handlePostpartum(data: any) {
    this.userStatus = 'Postpartum';
    this.isPregnant.set(false);
    this.isPostpartum = true;
  
    this.cycleSettings.setUserStatus('Postpartum');
    this.cycleSettings.setPostpartumStatus(true);
  }
  
  private handleTryingToConceive() {
    this.userStatus = 'Trying to Conceive';
    this.isPregnant.set(false);
    this.isPostpartum = false;
  
    this.cycleSettings.setUserStatus('Trying to Conceive');
    this.cycleSettings.setPregnancyStatus(false);
    this.cycleSettings.setPostpartumStatus(false);
  }
  
  private calculatePregnancyMetrics(lmp: string) {
    const w = gestationalWeekFromLmp(lmp);
    const now = new Date();
    
    // Logic to calculate days
    const u1 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lmp);
    const u0 = m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN;
    
    const diffDays = (Number.isFinite(u0) && u1 >= u0) ? Math.floor((u1 - u0) / 86400000) : 0;
  
    this.pregnancyWeek = w;
    this.pregnancyDayInWeek = diffDays % 7;
    this.pregnancyStartDate = lmp;
    this.pregnancyProgress = Math.min(100, Math.round((w / 40) * 100));
    
    this.cycleSettings.setPregnancyWeek(w);
    this.cycleSettings.setPregnancyProgress(this.pregnancyProgress);
  }
  
  private updateCommonCycleSettings(data: any) {
    if (data.cycle_length) this.cycleSettings.setCycleLength(data.cycle_length);
    if (data.period_length) this.cycleSettings.setPeriodLength(data.period_length);
    
    const lmpForCycle = normalizeLmpInput(data.lmp_date ?? data.last_period);
    if (lmpForCycle) {
      this.cycleSettings.setLastPeriodStart(lmpForCycle);
      this.periodStartDate = new Date(`${lmpForCycle}T12:00:00`);
      this.updateCycleDay();
    }
  }
  

  /**
   * Generate personalized messages for the user
   */
  generateMessages() {
    // Generate welcome message with user's name
    this.welcomeMessage = this.messageService.generateWelcomeMessage(
      this.userName
    );

    // Generate daily inspirational message
    this.dailyMessage = this.messageService.generateDailyMessage();

  }

  /**
   * Refresh the display based on current user status
   */
  refreshDisplay() {
    if (!this.authService.getAccessToken()) {
      this.loadPersistedData();
      return;
    }
    this.fetchDashboardAndApplyToView();
  }

  /**
   * Called when the page is about to enter
   * This ensures the chart is refreshed when returning from other pages
   */
  ionViewWillEnter() {
    this.syncLocalCycleViewFromStore();
    this.cdr.markForCheck();
    this.runPeriodChartRefresh();
    this.syncDashboardFromServerAndRefreshChart();
    this.homeFacade.loadRecentSymptomsHistory();
    this.loadTodaySymptoms();
    if (this.isPregnant()) {
      this.clearPregnancyCalendarSelectionIfInvalid();
    }
    this.scheduleScrollPregnancyCalendarToAnchor();
    this.periodChart?.scheduleWeekScrollToAnchor();
    setTimeout(() => this.schedulePregnancyConnectorUpdate(), 120);
  }

  async onTabPullRefresh(event: Event): Promise<void> {
    const target = event.target as HTMLIonRefresherElement;
    try {
      await this.runPullToRefresh();
    } catch {
      /* non-fatal */
    } finally {
      target.complete();
    }
  }

  /**
   * Pull-to-refresh from main tabs (layout ion-refresher).
   */
  async runPullToRefresh(): Promise<void> {
    this.generateMessages();
    this.refreshDailyMessage();
    this.loadTodaySymptoms();
    this.homeFacade.loadRecentSymptomsHistory(true);
    this.initializeHealthTip();

    if (!this.authService.getAccessToken()) {
      this.loadPersistedData();
      this.runPeriodChartRefresh();
      this.cdr.markForCheck();
      return;
    }

    this.fetchDashboardAndApplyToView(true);
  }

  /**
   * GET /me/dashboard (+ onboarding journey), apply to cycle/pregnancy home UI, refresh chart.
   * Skips one fetch when profile/week-detail already pushed fresh dashboard via the journey bridge.
   */
  private fetchDashboardAndApplyToView(forceRemote = false): void {
    this.homeFacade.syncDashboardJourney(forceRemote).subscribe({
      next: (state) => {
        if (state) {
          this.applyJourneyStateToView(state);
        }
        this.runPeriodChartRefresh();
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (err instanceof HomeUnauthenticatedError) {
          this.loadPersistedData();
          this.runPeriodChartRefresh();
          this.cdr.markForCheck();
          return;
        }
        console.error('Home dashboard sync failed:', err);
        this.loadPersistedData();
        this.runPeriodChartRefresh();
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * One dashboard read per enter: week-detail save publishes via signal first, else GET.
   */
  private syncDashboardFromServerAndRefreshChart() {
    this.fetchDashboardAndApplyToView();
  }

  private async syncLatestPeriodLogFromApi(): Promise<void> {
    const userId = this.homeData.getCurrentUserId();
    if (userId <= 0) return;

    try {
      this.updateCycleDay();
      this.runPeriodChartRefresh();
      this.cdr.markForCheck();
    } catch {
      // Non-blocking: dashboard/local state still keeps Home usable.
    }
  }

  private loadDashboardState() {
    this.fetchDashboardAndApplyToView();
  }

  private applyJourneyStateToView(state: HomePageJourneyState) {
    this.userStatus = state.userStatus;
    this.isPregnant.set(state.isPregnant);
    this.isPostpartum = state.isPostpartum;
    this.needsPregnancyInput = false;
    this.dashboardPregnancyTips = [];
    this.dashboardPregnancyInsight = null;
    this.dashboardPhaseGuide = null;
    this.dashboardCycleTips = [];
    this.dashboardCycleDay = state.dashboardCycleDay ?? null;
    this.dashboardCycleLength = state.dashboardCycleLength ?? null;
    this.dashboardOvulationDate = state.dashboardOvulationIso ?? null;
    this.dashboardFertileWindow = state.dashboardFertileWindow ?? null;
    this.dashboardCycleInsight = state.dashboardCycleInsight ?? null;
    this.dashboardPhaseGuide = state.dashboardPhaseGuide ?? null;
    this.dashboardCycleTips = state.dashboardTips ?? [];
    this.dashboardNextPeriodDate = state.dashboardNextPeriodIso
      ? new Date(`${state.dashboardNextPeriodIso}T12:00:00`)
      : null;

    if (state.isPregnant) {
      this.needsPregnancyInput = !!state.needsPregnancyInput;
      if (this.needsPregnancyInput) {
        // Server has no usable pregnancy timeline yet; never reuse stale cached values.
        this.pregnancyWeek = 0;
        this.pregnancyDayInWeek = 0;
        this.pregnancyProgress = 0;
        this.cycleSettings.setPregnancyWeek(0);
        this.cycleSettings.setPregnancyProgress(0);
      } else if (state.pregnancyWeek != null) {
        this.pregnancyWeek = state.pregnancyWeek;
      }
      if (state.pregnancyDay != null) {
        this.pregnancyDayInWeek = state.pregnancyDay;
      }
      if (state.pregnancyProgress != null) {
        this.pregnancyProgress = state.pregnancyProgress;
      }
      if (state.lastMenstrualPeriodIso) {
        this.pregnancyStartDate = state.lastMenstrualPeriodIso;
      } else if (this.needsPregnancyInput) {
        this.pregnancyStartDate = '';
      }
      this.dashboardPregnancyTips = state.dashboardTips ?? [];
      this.dashboardPregnancyInsight =
        state.pregnancyDashboardInsight?.trim() ?? null;
      this.promoteOnboardingPregnancyIfNeeded();
    } else {
      this.pregnancyWeek = this.cycleSettings.pregnancyWeek();
      this.pregnancyProgress = this.cycleSettings.pregnancyProgress();
      this.pregnancyStartDate = '';
    }
    this.periodStartDate = state.periodStartDate;
    const settingsCycleLen = this.cycleSettings.cycleLength();
    this.currentCycleLength =
      settingsCycleLen >= 21
        ? settingsCycleLen
        : state.dashboardCycleLength ?? this.currentCycleLength;
    this.periodLength = this.cycleSettings.periodLength();
    const storedLmp = this.cycleSettings.lastPeriodStartDate();
    this.lastPeriodStartIso = storedLmp
      ? storedLmp.includes('T')
        ? storedLmp.split('T')[0]
        : storedLmp.slice(0, 10)
      : null;
    if (!this.periodStartDate && this.cycleSettings.lastPeriodStartDate()) {
      const iso = this.cycleSettings.lastPeriodStartDate()!;
      const day = iso.includes('T') ? iso.split('T')[0] : iso.slice(0, 10);
      this.periodStartDate = new Date(`${day}T12:00:00`);
    }
    if (state.cycleDayDirty || this.periodStartDate) {
      this.updateCycleDay();
    } else if (
      this.dashboardCycleDay != null &&
      this.dashboardCycleDay >= 1
    ) {
      this.currentCycleDay = Math.round(this.dashboardCycleDay);
    }

    if (this.isPregnant()) {
      this.recomputePregnancyStatsFromLmpIfAvailable();
      this.clearPregnancyCalendarSelectionIfInvalid();
      this.scheduleScrollPregnancyCalendarToAnchor();
    }
    if (
      !this.isPregnant() &&
      !this.isPostpartum &&
      this.isHomeCycleTrackingLayout() &&
      !this.showStartTrackingOnboarding()
    ) {
      this.periodChart?.scheduleWeekScrollToAnchor();
    }
    this.schedulePregnancyConnectorUpdate();
    this.runPeriodChartRefresh();
  }

  /**
   * If dashboard says pregnancy setup is missing but onboarding already has LMP,
   * push it once to reproductive state so Home no longer asks to add date again.
   */
  private promoteOnboardingPregnancyIfNeeded(): void {
    if (!this.authService.getAccessToken()) {
      return;
    }
    if (!this.isPregnant || !this.needsPregnancyInput) {
      return;
    }
    if (this.isPromotingOnboardingPregnancy) {
      return;
    }
    const promotedKey = '__pregnancy_lmp_promoted_from_onboarding__';
    if (sessionStorage.getItem(promotedKey) === '1') {
      return;
    }

    let data: {
      pregnancy_status?: string;
      lmp_date?: unknown;
      last_period?: unknown;
      cycle_length?: number;
    } | null = null;
    try {
      const raw = localStorage.getItem('onboarding_data');
      if (!raw) {
        return;
      }
      data = JSON.parse(raw);
    } catch {
      return;
    }
    if (!data) {
      return;
    }
    const status = String(data.pregnancy_status ?? '').toLowerCase();
    if (status !== 'pregnant') {
      return;
    }
    const lmp = normalizeLmpInput(data.lmp_date ?? data.last_period);
    if (!lmp) {
      return;
    }

    this.isPromotingOnboardingPregnancy = true;
  }

  /**
   * Keep UI week/day/progress anchored to LMP date when available.
   * This prevents stale cached `pregnancyWeek` values (e.g. from older profile edits)
   * from overriding the date-based pregnancy timeline.
   */
  private recomputePregnancyStatsFromLmpIfAvailable(): void {
    if (!this.pregnancyStartDate) {
      return;
    }
    const lmpIso = isoDateOnly(this.pregnancyStartDate);
    if (!lmpIso) {
      return;
    }
    const lmp = new Date(`${lmpIso}T00:00:00Z`);
    if (Number.isNaN(lmp.getTime())) {
      return;
    }
    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const diffDays = Math.max(
      0,
      Math.floor((todayUtc.getTime() - lmp.getTime()) / 86400000)
    );
    const week = Math.min(42, Math.max(1, gestationalWeekFromLmp(lmpIso, now)));
    const day = diffDays % 7;
    const progress = Math.min(100, Math.round((diffDays / 280) * 100));
    this.pregnancyWeek = week;
    this.pregnancyDayInWeek = day;
    this.pregnancyProgress = progress;
    this.cycleSettings.setPregnancyWeek(week);
    this.cycleSettings.setPregnancyProgress(progress);
  }

  /** Drop picked day if it no longer maps to week 4–40 (e.g. start date updated). */
  private clearPregnancyCalendarSelectionIfInvalid(): void {
    if (!this.pregnancyCalendarViewDate) {
      return;
    }
    const w = this.getPregnancyWeekForCalendarDay(
      this.pregnancyCalendarViewDate
    );
    if (w === null) {
      return;
    }
    if (
      w < this.pregnancyCalendarMinWeek ||
      w > this.pregnancyCalendarMaxWeek
    ) {
      this.pregnancyCalendarViewDate = null;
      this.pregnancyCalendarSelectedIsoKey = null;
    }
  }

  /**
   * Whether to show the “Start tracking” card + quick action.
   * Reads {@link CycleSettingsService#lastPeriodStartDate} on the component so the template
   * stays subscribed to that signal (delegating only to the service hid updates after save).
   */
  showStartTrackingOnboarding(): boolean {
    if (this.isPregnant() || this.isPostpartum) {
      return false;
    }
    if (this.cycleSettings.isPregnant() || this.cycleSettings.isPostpartum()) {
      return false;
    }
    if (this.cycleSettings.lastPeriodStartDate() || this.periodStartDate) {
      return false;
    }
    return true;
  }

  getPreCycleEmptyCopy(): { title: string; body: string; features: string[] } {
    let intent: string | null = null;
    try {
      const raw = localStorage.getItem('onboarding_data');
      if (raw) {
        intent = JSON.parse(raw)?.pregnancy_status ?? null;
      }
    } catch {
      intent = null;
    }
    if (intent === 'trying') {
      return {
        title: this.tr('home.preCycle.titleTrying'),
        body: this.tr('home.preCycle.bodyTrying'),
        features: [
          this.tr('home.preCycle.tf1'),
          this.tr('home.preCycle.tf2'),
          this.tr('home.preCycle.tf3'),
        ],
      };
    }
    return {
      title: this.tr('home.preCycle.titleDefault'),
      body: this.tr('home.preCycle.bodyDefault'),
      features: [
        this.tr('home.preCycle.f1'),
        this.tr('home.preCycle.f2'),
        this.tr('home.preCycle.f3'),
      ],
    };
  }

  /**
   * Server `reproductive_state` uses `cycle` (default) or `planning`; older clients stored
   * {@link userStatus} as "Cycle Tracking" for `cycle`. The compact cycle home layout applies to both.
   */
  isHomeCycleTrackingLayout(): boolean {
    return (
      this.userStatus === 'Trying to Conceive' ||
      this.userStatus === 'Cycle Tracking'
    );
  }

  private runPeriodChartRefresh(attempt = 0): void {
    const refresh = () => {
      if (!this.periodChart) {
        return false;
      }
      this.periodChart.refreshChart();
      this.periodChart.scheduleWeekScrollToAnchor();
      return true;
    };

    if (refresh()) {
      return;
    }
    if (attempt >= 5) {
      return;
    }
    setTimeout(() => this.runPeriodChartRefresh(attempt + 1), 80 * (attempt + 1));
  }

  getBabyDevelopmentFacts(week: number): string {
    return getBabyDevelopmentFactForWeek(week);
  }

  getFunFacts(week: number): string {
    return getBabyFunFactForWeek(week);
  }

  /**
   * Update onboarding data in localStorage
   */
  private updateOnboardingData(newStatus: string, pregnancyWeek?: number) {
    try {
      const onboardingData = localStorage.getItem('onboarding_data');
      if (onboardingData) {
        const data = JSON.parse(onboardingData);
        data.pregnancy_status = newStatus;

        // Update pregnancy-specific data
        if (newStatus === 'pregnant' && pregnancyWeek) {
          data.pregnancy_week = pregnancyWeek;
        } else if (newStatus !== 'pregnant') {
          delete data.pregnancy_week;
        }

        localStorage.setItem('onboarding_data', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error updating onboarding data:', error);
    }
  }

  /**
   * Generate a new daily message (useful for refresh or new day)
   */
  refreshDailyMessage() {
    this.dailyMessage = this.messageService.generateDailyMessage();
    this.showToast(this.tr('home.toast.dailyMessageRefreshed'));
  }

  /**
   * Generate mood-based message
   */
  generateMoodMessage(mood: string) {
    const moodMessage = this.messageService.generateMoodBasedMessage(mood);
    this.showToast(this.tr('home.toast.moodMessage', { message: moodMessage }));
  }

  // Hero Section Actions
  trackToday() {
    this.openCycleCalendar();
  }

  openCycleCalendar() {
    this.router.navigate(['/cycle-calendar']);
  }

  viewCalendar() {
    this.openCalendarView();
  }

 
  // Pregnancy Progress
  viewPregnancyDetails() {
    const w = this.getPregnancyWeekDetailRouteParam();
    this.router.navigate(['/week-detail'], {
      queryParams: { week: w },
    });
    this.showToast(this.tr('home.dialog.openingWeekDetails', { week: w }));
  }

  private readonly defaultBabySize: BabySizeData = {
    week: 12,
    size: 'Lime lime',
    weight: '45g',
    description: 'Your baby is growing beautifully.',
  };

  /** Always returns a defined object (baby data may still be loading or empty). */
  getCurrentBabySize(): BabySizeData {
    const all = this.babyDevelopmentService.getAllBabySizeData();
    if (!all?.length) {
      return this.defaultBabySize;
    }
    const match = all.find(
      (d) => d.week === this.getPregnancyWeekDetailRouteParam()
    );
    if (match?.size) {
      return match;
    }
    const byIndex = all[8];
    if (byIndex?.size) {
      return byIndex;
    }
    const first = all[0];
    if (first?.size) {
      return first;
    }
    return this.defaultBabySize;
  }

  // Update pregnancy week and recalculate progress (local preview; `week` = completed weeks since LMP)
  updatePregnancyWeek(week: number) {
    // Keep one source of truth: LMP/server dashboard. Do not let local manual preview overwrite it.
    if (!this.pregnancyStartDate) {
      return;
    }
    this.recomputePregnancyStatsFromLmpIfAvailable();
  }

  // Get baby length based on week
  getBabyLength() {
    const lengths: { [key: number]: string } = {
      4: '0.04 inches',
      5: '0.13 inches',
      6: '0.25 inches',
      7: '0.5 inches',
      8: '0.63 inches',
      9: '0.9 inches',
      10: '1.22 inches',
      11: '1.61 inches',
      12: '2.13 inches',
      13: '2.91 inches',
      14: '3.42 inches',
      15: '3.98 inches',
      16: '4.57 inches',
      17: '5.12 inches',
      18: '5.59 inches',
      19: '6.02 inches',
      20: '6.46 inches',
      21: '10.51 inches',
      22: '10.94 inches',
      23: '11.38 inches',
      24: '11.81 inches',
      25: '13.62 inches',
      26: '14.02 inches',
      27: '14.41 inches',
      28: '14.80 inches',
      29: '15.2 inches',
      30: '15.71 inches',
      31: '16.18 inches',
      32: '16.69 inches',
      33: '17.20 inches',
      34: '17.72 inches',
      35: '18.19 inches',
      36: '18.66 inches',
      37: '19.13 inches',
      38: '19.61 inches',
      39: '19.96 inches',
      40: '20.16 inches',
    };
    return lengths[this.getPregnancyWeekDetailRouteParam()] || 'Growing...';
  }

  // Change week navigation
  changeWeek(direction: number) {
    const clinical = this.getPregnancyWeekDetailRouteParam();
    const newClinical = clinical + direction;
    if (newClinical >= 1 && newClinical <= 40) {
      this.updatePregnancyWeek(newClinical - 1);
      this.showToast(
        `Week ${newClinical}: Your baby is now the size of a ${
          this.getCurrentBabySize().size.split(' ')[0]
        }! 🎉`
      );
    }
  }

  // Postpartum methods
  getCurrentPostpartumData() {
    const currentData = this.postpartumData.find(
      (data) => data.week === this.postpartumWeek
    );
    return currentData || this.postpartumData[0];
  }

  updatePostpartumWeek(week: number) {
    this.postpartumWeek = week;
    this.babyAge = `${week} week${week > 1 ? 's' : ''} old`;
    // Update baby stats based on week
    const weightGain = week * 0.2; // Approximate weight gain per week
    this.postpartumBabyWeight = `${(3.2 + weightGain).toFixed(1)}kg`;
    const lengthGain = week * 0.5; // Approximate length gain per week
    this.postpartumBabyLength = `${(50 + lengthGain).toFixed(0)}cm`;
  }

  changePostpartumWeek(direction: number) {
    const newWeek = this.postpartumWeek + direction;
    if (newWeek >= 1 && newWeek <= 12) {
      this.updatePostpartumWeek(newWeek);
      const postpartumData = this.getCurrentPostpartumData();
      this.showToast(
        `Week ${newWeek}: ${postpartumData.recovery} - ${postpartumData.tips} 💕`
      );
    }
  }

  // Get baby milestones based on age
  getBabyMilestones() {
    const milestones: { [key: number]: string[] } = {
      1: ['Lifts head briefly', 'Responds to sounds', 'Makes eye contact'],
      2: [
        'Follows objects with eyes',
        'Makes cooing sounds',
        'Smiles responsively',
      ],
      3: ['Holds head up longer', 'Reaches for objects', 'Laughs out loud'],
      4: ['Rolls from tummy to back', 'Grasps objects', 'Babbles more'],
      5: ['Sits with support', 'Recognizes familiar faces', 'Shows excitement'],
      6: [
        'Rolls both ways',
        'Passes objects between hands',
        'Responds to name',
      ],
      8: ['Sits without support', 'Crawls or scoots', 'Says "mama" or "dada"'],
      12: ['Pulls to stand', 'Takes first steps', 'Says first words'],
    };
    return (
      milestones[this.postpartumWeek] || ['Growing and developing beautifully!']
    );
  }

  // Appointment Management
  async rescheduleAppointment(appointment: any) {
    const alert = await this.alertController.create({
      header: this.tr('home.alert.rescheduleHeader'),
      message: this.tr('home.alert.rescheduleMessage', {
        title: appointment.title,
        doctor: appointment.doctor,
      }),
      buttons: [
        {
          text: this.tr('home.common.cancel'),
          role: 'cancel',
        },
        {
          text: this.tr('home.dialog.reschedule'),
          handler: () => {
            this.router.navigate(['/tabs/consultation']);
            this.showToast(this.tr('home.dialog.openingAppointmentBooking'));
          },
        },
      ],
    });
    await alert.present();
  }

  async cancelAppointment(appointment: any) {
    const alert = await this.alertController.create({
      header: this.tr('home.alert.cancelHeader'),
      message: this.tr('home.alert.cancelMessage', {
        title: appointment.title,
      }),
      buttons: [
        {
          text: this.tr('home.dialog.no'),
          role: 'cancel',
        },
        {
          text: this.tr('home.dialog.yesCancel'),
          handler: () => {
            this.upcomingAppointments = this.upcomingAppointments.filter(
              (apt) => apt !== appointment
            );
            this.showToast(this.tr('home.dialog.appointmentCancelled'));
          },
        },
      ],
    });
    await alert.present();
  }

  bookNewAppointment() {
    this.router.navigate(['/tabs/consultation']);
    this.showToast(this.tr('home.dialog.openingAppointmentBooking'));
  }

  // Open daily tracking modal
  async openDailyTracking() {
    const alert = await this.alertController.create({
      header: this.tr('home.alert.trackTodayHeader'),
      message: this.tr('home.alert.trackTodayMessage'),
      buttons: [
        {
          text: this.tr('home.common.cancel'),
          role: 'cancel',
        },
        {
          text: this.tr('home.dialog.trackSymptomsMood'),
          handler: () => {
            this.openSymptomsTracking();
          },
        },
        {
          text: this.tr('home.dialog.trackMedications'),
          handler: () => {
            this.openMedicationReminder();
          },
        },
        {
          text: this.tr('home.dialog.trackNutrition'),
          handler: () => {
            this.openNutritionTracker();
          },
        },
        {
          text: this.tr('home.dialog.trackExercise'),
          handler: () => {
            this.openExercisePlanner();
          },
        },
      ],
    });

    await alert.present();
  }

  // Open calendar view
  async openCalendarView() {
    const alert = await this.alertController.create({
      header: this.tr('home.alert.calendarViewHeader'),
      message: this.tr('home.alert.calendarViewMessage'),
      buttons: [
        {
          text: this.tr('home.common.cancel'),
          role: 'cancel',
        },
        {
          text: this.tr('home.dialog.calendarCycleTracking'),
          handler: () => {
            this.router.navigate(['/tools']);
            this.showToast(
              this.tr('home.dialog.openingCycleCalendar'),
              'success'
            );
          },
        },
        {
          text: this.tr('home.dialog.calendarSymptomsLog'),
          handler: () => {
            this.router.navigate(['/tools']);
            this.showToast(
              this.tr('home.dialog.openingSymptomsCalendar'),
              'success'
            );
          },
        },
        {
          text: this.tr('home.dialog.calendarMedication'),
          handler: () => {
            this.router.navigate(['/tools']);
            this.showToast(
              this.tr('home.dialog.openingMedicationCalendar'),
              'success'
            );
          },
        },
        {
          text: this.tr('home.dialog.calendarAppointments'),
          handler: () => {
            this.openAppointmentBooking();
          },
        },
      ],
    });

    await alert.present();
  }

  // Quick Actions with proper functionality
  async onActionClick(action: string) {
    switch (action) {
      case 'pregnant':
        if (this.isPregnant()) {
          await this.handleNotPregnantUpdate();
        } else {
          await this.handlePregnancyUpdate();
        }
        break;
      case 'symptoms':
        await this.openSymptomsTracking();
        break;
      case 'appointment':
        await this.openAppointmentBooking();
        break;
      case 'community':
        await this.navigateToCommunity();
        break;
      case 'feeding':
        await this.openFeedingTracker();
        break;
      case 'sleep':
        await this.openSleepTracker();
        break;
    }
  }

  // Handle "I became pregnant" action
  async handlePregnancyUpdate() {
    const alert = await this.alertController.create({
      header: this.tr('home.alert.congratsPregnantHeader'),
      message: this.tr('home.alert.handlePregnantCongratsBody'),
      buttons: [
        {
          text: this.tr('home.common.cancel'),
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.tr('home.dialog.updateStatus'),
          handler: async () => {
            console.log('🔍 User clicked Update Status');
            await this.updatePregnancyStatus();
          },
        },
      ],
    });

    await alert.present();
  }

  // Handle "I'm not pregnant anymore" action
  async handleNotPregnantUpdate() {
    const alert = await this.alertController.create({
      header: this.tr('home.alert.updateStatusShortHeader'),
      message: this.tr('home.alert.confirmNotPregnantMessage'),
      buttons: [
        {
          text: this.tr('home.common.cancel'),
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.tr('home.dialog.updateStatus'),
          handler: async () => {
            await this.updateNotPregnantStatus();
          },
        },
      ],
    });

    await alert.present();
  }

  // Update not pregnant status
  async updateNotPregnantStatus() {
    try {
      this.userStatus = 'Trying to Conceive';
      this.isPostpartum = false;

      // Reset pregnancy-related data
      this.pregnancyWeek = 0;
      this.pregnancyProgress = 0;

      // Save to persistent storage
      this.cycleSettings.setUserStatus('Trying to Conceive');

      this.cycleSettings.setPostpartumStatus(false);
      this.cycleSettings.setPregnancyWeek(0);
      this.cycleSettings.setPregnancyProgress(0);

      // Update onboarding data in localStorage
      this.updateOnboardingData('trying');

      // Refresh the display to show cycle tracking
      this.refreshDisplay();

      const successAlert = await this.alertController.create({
        header: this.tr('home.alert.statusUpdatedHeader'),
        message: this.tr('home.alert.statusUpdatedTryingBody'),
        buttons: [
          {
            text: this.tr('home.common.continue'),
            role: 'cancel',
          },
        ],
      });

      await successAlert.present();

      // Show success toast
      this.showToast(this.tr('home.dialog.statusUpdatedSuccess'), 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      this.showToast(this.tr('home.dialog.statusUpdateError'), 'danger');
    }
  }

  // Update pregnancy status — opens Flo-style setup (LMP, week, or due date); server stores LMP only.
  async updatePregnancyStatus() {
    await this.presentPregnancySetupModal();
  }

  /** Opens the pregnancy date sheet and PATCHes `/me/state` with exactly one pregnancy input. */
  async presentPregnancySetupModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: PregnancySetupSheetComponent,
    });
    await modal.present();
    const { data, role } =
      await modal.onWillDismiss<InitializeReproductiveStateDto>();
    if (role !== 'confirm' || !data) {
      return;
    }
    try {
      await this.runPullToRefresh();
      await this.showToast(
        this.tr('home.dialog.pregnancyDatesSaved'),
        'success'
      );
    } catch (err: any) {
      const msg =
        err?.error?.message ??
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null);
      await this.showToast(
        typeof msg === 'string' ? msg : this.tr('home.dialog.saveDatesFailed'),
        'danger'
      );
    }
  }

  // Open symptoms tracking
  openSymptomsTracking() {
    this.router.navigate(['/symptoms-tracker']);
    this.showToast(this.tr('home.toast.openingSymptomTracker'));
  }

  // Navigate to school (baby development)
  navigateToSchool() {
    this.router.navigate(['/tabs/school']);
    this.showToast(this.tr('home.toast.openingBabyDevelopment'));
  }

  // Open nutrition guide
  openNutritionGuide() {
    this.showToast(this.tr('home.toast.nutritionGuideSoon'));
  }

  // Symptoms Summary Methods
  todaySymptoms: SymptomsDto = {} as SymptomsDto;

  loadTodaySymptoms() {
    // First try to get from local service (faster)
    const localData = this.trackDataService.getTodayTrackData();
    if (localData) {
      this.todaySymptoms = localData as SymptomsDto;
      console.log('🔍 Today symptoms from local service:', this.todaySymptoms);
      return;
    }

  }

  // Daily Insights Methods
  getCurrentCycleDay(): number {
    // Calculate current cycle day based on last period
    const lastPeriod = localStorage.getItem('lastPeriodDate');
    if (lastPeriod) {
      const lastPeriodDate = new Date(lastPeriod);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastPeriodDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.min(diffDays, 28); // Cap at 28 days
    }
    return 1;
  }

  getPregnancyChance(): string {
    const cycleDay = this.getCurrentCycleDay();
    if (cycleDay >= 10 && cycleDay <= 17) {
      return 'Higher chance';
    } else if (
      (cycleDay >= 6 && cycleDay <= 9) ||
      (cycleDay >= 18 && cycleDay <= 22)
    ) {
      return 'Medium chance';
    } else {
      return 'Lower chance';
    }
  }

  // Static health tip to avoid ExpressionChangedAfterItHasBeenCheckedError
  healthTip: string = 'Stay hydrated and get enough sleep';

  getHealthTip(): string {
    return this.healthTip;
  }

  initializeHealthTip() {
    const tips = [
      'Stay hydrated and get enough sleep',
      'Include iron-rich foods in your diet',
      'Practice gentle exercise regularly',
      'Track your symptoms daily',
      "Listen to your body's signals",
    ];
    this.healthTip = tips[Math.floor(Math.random() * tips.length)];
  }

  // Symptoms History Methods
  getRecentSymptomsDays() {
    return this.homeFacade.recentSymptomsDays();
  }

  loadRecentSymptomsDays(force = false): void {
    this.homeFacade.loadRecentSymptomsHistory(force);
    this.cdr.markForCheck();
  }

  /** Calendar day key from API / Prisma date field. */
  private isoDateFromTrackRow(value: unknown): string {
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return d.toISOString().split('T')[0];
  }

  private symptomMetaById(): Map<string, { name: string; icon: string }> {
    const m = new Map<string, { name: string; icon: string }>();
    for (const s of getAllSymptoms()) {
      m.set(s.id, { name: s.name, icon: s.icon });
    }
    return m;
  }

  /**
   * Human-readable mood / energy / symptom lines from one track-day row (API shape).
   */
  private describeSymptomLogRow(row: any): {
    moodText: string;
    energyText: string;
    symptomNames: string[];
    primaryIonIcon: string;
  } {
    const byId = this.symptomMetaById();
    let moodText = '';
    const rawMood = row?.mood;
    if (typeof rawMood === 'string' && rawMood) {
      moodText = byId.get(rawMood)?.name ?? rawMood.replace(/_/g, ' ');
    } else if (rawMood && typeof rawMood === 'object') {
      const id = String(rawMood['id'] ?? '');
      moodText =
        byId.get(id)?.name ??
        String(rawMood['name'] ?? rawMood['label'] ?? id).trim();
    }
    let energyText = '';
    const rawEnergy = row?.energy;
    if (typeof rawEnergy === 'string' && rawEnergy) {
      energyText = rawEnergy.replace(/_/g, ' ');
    } else if (rawEnergy && typeof rawEnergy === 'object') {
      energyText = String(
        rawEnergy['name'] ?? rawEnergy['label'] ?? rawEnergy['id'] ?? ''
      ).trim();
    }
    const symptomNames: string[] = [];
    let primaryIonIcon = 'analytics-outline';
    let firstIconSet = false;
    const rawSymptoms = row?.symptoms;
    const list = Array.isArray(rawSymptoms) ? rawSymptoms : [];
    for (const s of list) {
      const id = typeof s === 'string' ? s : String(s?.id ?? '').trim();
      if (!id) {
        continue;
      }
      const meta = byId.get(id);
      const label =
        (meta?.name ??
          (typeof s === 'object' && s ? String(s['name'] ?? '').trim() : '')) ||
        id.replace(/_/g, ' ');
      symptomNames.push(label);
      const iconFromRow =
        typeof s === 'object' && s ? String(s['icon'] ?? '').trim() : '';
      const icon = iconFromRow || meta?.icon;
      if (icon && !firstIconSet) {
        primaryIonIcon = icon;
        firstIconSet = true;
      }
    }
    return { moodText, energyText, symptomNames, primaryIonIcon };
  }

  private truncateInsightTeaser(text: string, max = 40): string {
    const t = text.trim();
    if (t.length <= max) {
      return t;
    }
    return `${t.slice(0, Math.max(0, max - 1))}…`;
  }

  /**
   * First strip card: last symptom log from API (names/icons resolved from stored ids).
   */
  private buildSymptomLogInsightTopic(
    scope: 'cycle' | 'pregnancy'
  ): DailyInsightTopic {
    const last = this.homeFacade.recentSymptomsDays()[0];
    if (!last) {
      return {
        id: `${scope}-symptom-log`,
        categoryLabel: this.tr('home.symptomLog.category'),
        teaser: this.truncateInsightTeaser(
          this.tr('home.symptomLog.emptyTeaser')
        ),
        accentHex: '#94a3b8',
        ionIcon: 'analytics-outline',
        slides: [
          {
            title: this.tr('home.symptomLog.slideEmpty1Title'),
            body: this.tr('home.symptomLog.slideEmpty1Body'),
          },
          {
            title: this.tr('home.symptomLog.slideEmpty2Title'),
            body: this.tr('home.symptomLog.slideEmpty2Body'),
          },
        ],
      };
    }
    const dateKey = this.isoDateFromTrackRow(last.date);
    const noonIso = dateKey ? `${dateKey}T12:00:00` : '';
    const calLabel = noonIso ? this.formatDate(noonIso) : '';
    const dayLabel = noonIso ? this.getDayName(noonIso) : '';
    const { moodText, energyText, symptomNames, primaryIonIcon } =
      this.describeSymptomLogRow(last);
    const bits: string[] = [];
    if (moodText) {
      bits.push(moodText);
    }
    bits.push(...symptomNames.slice(0, 3));
    const teaserCore =
      calLabel && bits.length
        ? `${calLabel} · ${bits.join(' · ')}`
        : calLabel || this.tr('home.symptomLog.lastLog');
    const teaser = this.truncateInsightTeaser(teaserCore);

    const detailLines: string[] = [];
    if (dayLabel) {
      detailLines.push(
        this.tr('home.symptomLog.lineCalendar', {
          date: calLabel,
          weekday: dayLabel,
        })
      );
    }
    if (moodText) {
      detailLines.push(this.tr('home.symptomLog.lineMood', { mood: moodText }));
    }
    if (energyText) {
      detailLines.push(
        this.tr('home.symptomLog.lineEnergy', { energy: energyText })
      );
    }
    if (symptomNames.length) {
      detailLines.push(
        this.tr('home.symptomLog.lineSymptoms', {
          list: symptomNames.join(', '),
        })
      );
    } else {
      detailLines.push(this.tr('home.symptomLog.lineNoSymptoms'));
    }
    const notes = String(last.notes ?? '').trim();
    if (notes) {
      detailLines.push(this.tr('home.symptomLog.lineNotes', { notes }));
    }

    const recentLines = this.homeFacade.recentSymptomsDays().slice(0, 6).map((row) => {
      const dk = this.isoDateFromTrackRow(row.date);
      const label = dk ? this.formatDate(`${dk}T12:00:00`) : '';
      const { moodText: m, symptomNames: sn } = this.describeSymptomLogRow(row);
      const parts = [m, ...sn.slice(0, 2)].filter(Boolean);
      return `• ${label}${parts.length ? ` — ${parts.join(', ')}` : ''}`;
    });

    return {
      id: `${scope}-symptom-log`,
      categoryLabel: this.tr('home.symptomLog.category'),
      teaser,
      accentHex: '#64748b',
      ionIcon: primaryIonIcon,
      slides: [
        {
          title: this.tr('home.symptomLog.slideLogged1Title'),
          body: detailLines.join(' '),
        },
        {
          title: this.tr('home.symptomLog.slideLogged2Title'),
          body:
            recentLines.length > 1
              ? this.tr('home.symptomLog.slideLogged2BodyMulti', {
                  lines: recentLines.join('\n'),
                })
              : this.tr('home.symptomLog.slideLogged2BodySingle'),
        },
      ],
    };
  }

  getDayName(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return this.tr('home.day.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return this.tr('home.day.yesterday');
    } else {
      return date.toLocaleDateString(this.dateLocaleTag(), {
        weekday: 'short',
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(this.dateLocaleTag(), {
      month: 'short',
      day: 'numeric',
    });
  }

  viewDayDetails(date: string) {
    this.router.navigate(['/symptoms-detail'], {
      queryParams: { date: date },
    });
  }

  // Track symptoms
  async trackSymptoms(mood: string) {
    try {
      const moodEmoji: Record<string, string> = {
        great: '😊',
        okay: '😐',
        not_great: '😔',
      };

      await this.showToast(
        `${moodEmoji[mood]} ${this.tr('home.symptomsTracked')}`,
        'success'
      );
    } catch (error) {
      await this.showToast(this.tr('home.symptomsTrackFailed'), 'danger');
    }
  }

  // Open appointment booking
  async openAppointmentBooking() {
    const alert = await this.alertController.create({
      header: this.tr('home.alert.bookAppointmentHeader'),
      message: this.tr('home.alert.bookAppointmentMessage'),
      buttons: [
        {
          text: this.tr('home.common.cancel'),
          role: 'cancel',
        },
        {
          text: this.tr('home.dialog.bookingPrenatal'),
          handler: () => {
            this.bookAppointment('prenatal');
          },
        },
        {
          text: this.tr('home.dialog.bookingNutrition'),
          handler: () => {
            this.bookAppointment('nutrition');
          },
        },
        {
          text: this.tr('home.dialog.bookingMental'),
          handler: () => {
            this.bookAppointment('mental_health');
          },
        },
      ],
    });

    await alert.present();
  }

  // Book appointment
  async bookAppointment(type: string) {
    try {
      const typeKeys: Record<string, string> = {
        prenatal: 'home.dialog.bookingPrenatal',
        nutrition: 'home.dialog.bookingNutrition',
        mental_health: 'home.dialog.bookingMental',
      };
      const typeLabel = this.tr(
        typeKeys[type] ?? 'home.dialog.bookingPrenatal'
      );

      await this.showToast(
        this.tr('home.dialog.openingBookingToast', { type: typeLabel }),
        'success'
      );

      const successAlert = await this.alertController.create({
        header: this.tr('home.dialog.appointmentBookingSuccessHeader'),
        message: this.tr('home.dialog.appointmentBookingSuccessMessage', {
          type: typeLabel,
        }),
        buttons: [{ text: this.tr('home.common.ok'), role: 'cancel' }],
      });

      await successAlert.present();
    } catch (error) {
      await this.showToast(this.tr('home.dialog.bookingFailed'), 'danger');
    }
  }

  // Navigate to community
  async navigateToCommunity() {
    try {
      await this.showToast(this.tr('home.dialog.joiningCommunity'), 'success');

      const communityAlert = await this.alertController.create({
        header: this.tr('home.dialog.communityHeader'),
        message: this.tr('home.dialog.communityMessage'),
        buttons: [
          {
            text: this.tr('home.dialog.learnMore'),
            handler: () => {
              // Navigate to community page
              this.router.navigate(['/tabs/social']);
            },
          },
          {
            text: this.tr('home.common.continue'),
            role: 'cancel',
          },
        ],
      });

      await communityAlert.present();
    } catch (error) {
      await this.showToast(this.tr('home.dialog.communityFailed'), 'danger');
    }
  }

  // Daily Tips Actions
  async viewCounselorSchedule() {
    try {
      await this.showToast(
        this.tr('home.dialog.openingCounselorSchedule'),
        'success'
      );

      const scheduleAlert = await this.alertController.create({
        header: this.tr('home.dialog.scheduleHeader'),
        message: this.tr('home.dialog.scheduleMessage'),
        buttons: [
          {
            text: this.tr('home.dialog.viewSchedule'),
            handler: () => {},
          },
          {
            text: this.tr('home.common.continue'),
            role: 'cancel',
          },
        ],
      });

      await scheduleAlert.present();
    } catch (error) {
      await this.showToast(this.tr('home.dialog.scheduleFailed'), 'danger');
    }
  }

  // Expert Actions
  async bookExpertConsultation() {
    try {
      await this.showToast(
        this.tr('home.dialog.openingExpertBooking'),
        'success'
      );

      const consultationAlert = await this.alertController.create({
        header: this.tr('home.dialog.expertHeader'),
        message: this.tr('home.dialog.expertMessage'),
        buttons: [
          {
            text: this.tr('home.dialog.bookNow'),
            handler: () => {
              // Navigate to booking page
              this.router.navigate(['/tabs/consultation']);
            },
          },
          {
            text: this.tr('home.common.continue'),
            role: 'cancel',
          },
        ],
      });

      await consultationAlert.present();
    } catch (error) {
      await this.showToast(
        this.tr('home.dialog.expertBookingFailed'),
        'danger'
      );
    }
  }

  // Health Tools Methods
  async openFertilityCalculator() {
    try {
      const modal = await this.modalController.create({
        component: FertilityOverviewSheetComponent,
        presentingElement: await this.modalController.getTop(),
        canDismiss: true,
        showBackdrop: true,
        backdropDismiss: true,
        cssClass: 'fertility-overview-sheet',
      });

      await modal.present();
      const { data } = await modal.onWillDismiss();

      if (!data?.action) return;

      switch (data.action) {
        case 'trackSymptoms':
          await this.openSymptomsTracking();
          break;
        case 'setReminder':
          if (data.results) await this.setFertilityReminder(data.results);
          break;
        case 'logPeriod':
          this.openPeriodDatePicker();
          break;
      }
    } catch (error) {
      await this.showToast(
        this.tr('home.dialog.fertilityCalcFailed'),
        'danger',
      );
    }
  }

  // Inline fertility calculator (Continue option)
  async showInlineFertilityCalculator() {
    try {
      // Check if user is pregnant
      const isPregnant = this.cycleSettings.isPregnant();

      if (isPregnant) {
        await this.showPregnancyWeekCalculator();
      } else {
        await this.showRegularFertilityCalculator();
      }
    } catch (error) {
      await this.showToast(this.tr('home.dialog.calcFailed'), 'danger');
    }
  }

  // Regular fertility calculator for non-pregnant users
  async showRegularFertilityCalculator() {
    const alert = await this.alertController.create({
      header: this.tr('home.alert.fertilityCalcHeader'),
      message: this.tr('home.dialog.fertilityCalcBody'),
      inputs: [
        {
          name: 'cycleLength',
          type: 'number',
          placeholder: this.tr('home.dialog.cycleLengthPlaceholder'),
          min: 21,
          max: 35,
          value: 28,
        },
        {
          name: 'lastPeriod',
          type: 'date',
          placeholder: this.tr('home.dialog.lastPeriodStartPlaceholder'),
        },
      ],
      buttons: [
        {
          text: this.tr('home.common.cancel'),
          role: 'cancel',
        },
        {
          text: this.tr('home.dialog.calculate'),
          handler: async (data) => {
            if (data.cycleLength && data.lastPeriod) {
              await this.calculateFertileDays(
                data.cycleLength,
                data.lastPeriod
              );
            } else {
              await this.showToast(
                this.tr('home.dialog.fillAllFields'),
                'warning'
              );
            }
          },
        },
      ],
    });

    await alert.present();
  }

  // Pregnancy week calculator for pregnant users
  async showPregnancyWeekCalculator() {
    const alert = await this.alertController.create({
      header: this.tr('home.alert.pregnancyWeekCalcHeader'),
      message: this.tr('home.dialog.pregnancyWeekCalcBody'),
      inputs: [
        {
          name: 'lastPeriod',
          type: 'date',
          placeholder: this.tr('home.dialog.lastMenstrualPeriodPlaceholder'),
        },
      ],
      buttons: [
        {
          text: this.tr('home.common.cancel'),
          role: 'cancel',
        },
        {
          text: this.tr('home.dialog.calculateWeek'),
          handler: async (data) => {
            if (data.lastPeriod) {
              await this.calculatePregnancyWeek(data.lastPeriod);
            } else {
              await this.showToast(this.tr('home.dialog.enterLmp'), 'warning');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  // Calculate fertile days
  private async calculateFertileDays(cycleLength: number, lastPeriod: string) {
    try {
      const lastPeriodDate = new Date(lastPeriod);
      const today = new Date();

      // Calculate ovulation day (typically 14 days before next period)
      const ovulationDay = new Date(lastPeriodDate);
      ovulationDay.setDate(ovulationDay.getDate() + cycleLength - 14);

      // Calculate fertile window (5 days before ovulation + ovulation day)
      const fertileStart = new Date(ovulationDay);
      fertileStart.setDate(fertileStart.getDate() - 5);

      const fertileEnd = new Date(ovulationDay);
      fertileEnd.setDate(fertileEnd.getDate() + 1);

      // Calculate next period
      const nextPeriod = new Date(lastPeriodDate);
      nextPeriod.setDate(nextPeriod.getDate() + cycleLength);

      // Format dates
      const formatDate = (date: Date) => {
        return date.toLocaleDateString(this.dateLocaleTag(), {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      };

      // Create fertile days array
      const fertileDays = [];
      const currentDate = new Date(fertileStart);
      while (currentDate <= fertileEnd) {
        fertileDays.push(formatDate(new Date(currentDate)));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Prepare results data
      const results: FertilityResults = {
        fertileDays,
        ovulationDay: formatDate(ovulationDay),
        nextPeriod: formatDate(nextPeriod),
        cycleLength,
        lastPeriodDate: formatDate(lastPeriodDate),
      };

      // Show results in beautiful modal
      const modal = await this.modalController.create({
        component: FertilityResultsModalComponent,
        componentProps: {
          results: results,
        },
        presentingElement: await this.modalController.getTop(),
        canDismiss: true,
        showBackdrop: true,
        backdropDismiss: true,
        cssClass: 'fertility-results-modal',
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();

      // Handle modal actions
      if (data?.action) {
        switch (data.action) {
          case 'trackSymptoms':
            await this.openSymptomsTracking();
            break;
          case 'setReminder':
            await this.setFertilityReminder(results);
            break;
          case 'exportResults':
            await this.exportFertilityResults(results);
            break;
        }
      }

      await this.showToast(
        this.tr('home.dialog.fertileDaysCalculated'),
        'success'
      );
    } catch (error) {
      console.error('Error calculating fertile days:', error);
      await this.showToast(
        this.tr('home.dialog.fertileDaysCalcFailed'),
        'danger'
      );
    }
  }

  // Calculate pregnancy week
  private async calculatePregnancyWeek(lastPeriod: string) {
    try {
      const lmpIso = isoDateOnly(lastPeriod) ?? String(lastPeriod).slice(0, 10);
      const pregnancyWeek = gestationalWeekFromLmp(lmpIso);
      const lmpDate = new Date(
        lmpIso.includes('T') ? lmpIso : `${lmpIso}T12:00:00`
      );
      const lm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lmpIso);
      const t = new Date();
      const uL = lm
        ? Date.UTC(Number(lm[1]), Number(lm[2]) - 1, Number(lm[3]))
        : Date.UTC(
            lmpDate.getFullYear(),
            lmpDate.getMonth(),
            lmpDate.getDate()
          );
      const uT = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
      const daysDifference = Math.max(
        0,
        Math.floor((uT - uL) / (1000 * 60 * 60 * 24))
      );

      // Validate pregnancy week
      if (pregnancyWeek < 4 || pregnancyWeek > 42) {
        await this.showToast(this.tr('home.dialog.invalidLmpWeeks'), 'warning');
        return;
      }

      // Calculate due date
      const dueDate = new Date(lmpDate);
      dueDate.setDate(dueDate.getDate() + 280); // 40 weeks

      // Calculate remaining weeks
      const remainingWeeks = Math.max(0, 40 - pregnancyWeek);

      // Calculate trimester
      const trimester = pregnancyWeek <= 13 ? 1 : pregnancyWeek <= 27 ? 2 : 3;

      // Calculate progress percentage
      const progressPercentage = Math.round((pregnancyWeek / 40) * 100);

      const formatDate = (date: Date) => {
        return date.toLocaleDateString(this.dateLocaleTag(), {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      };

      // Prepare results data
      const results: PregnancyResults = {
        pregnancyWeek,
        dueDate: formatDate(dueDate),
        remainingWeeks,
        progressPercentage,
        trimester,
        lastPeriodDate: formatDate(lmpDate),
        daysSinceConception: Math.max(0, daysDifference - 14), // Conception typically 14 days after LMP
      };

      // Show results in beautiful modal
      const modal = await this.modalController.create({
        component: PregnancyResultsModalComponent,
        componentProps: {
          results: results,
        },
        presentingElement: await this.modalController.getTop(),
        canDismiss: true,
        showBackdrop: true,
        backdropDismiss: true,
        cssClass: 'pregnancy-results-modal',
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();

      // Handle modal actions
      if (data?.action) {
        switch (data.action) {
          case 'updateProfile':
            this.cycleSettings.setPregnancyWeek(pregnancyWeek);
            await this.showToast(
              this.tr('home.dialog.pregnancyWeekUpdatedProfile'),
              'success'
            );
            break;
          case 'trackSymptoms':
            await this.openSymptomsTracking();
            break;
          case 'setAppointment':
            await this.showToast(
              this.tr('home.dialog.appointmentComingSoon'),
              'warning'
            );
            break;
        }
      }
    } catch (error) {
      console.error('Error calculating pregnancy week:', error);
      await this.showToast(
        this.tr('home.dialog.pregnancyWeekCalcFailed'),
        'danger'
      );
    }
  }

  // Set fertility reminder
  private async setFertilityReminder(results: FertilityResults) {
    try {
      const reminderAlert = await this.alertController.create({
        header: this.tr('home.dialog.reminderPromptHeader'),
        message: this.tr('home.dialog.reminderPromptMessage'),
        inputs: [
          {
            name: 'reminderType',
            type: 'radio',
            label: this.tr('home.dialog.reminderRadio1'),
            value: '1day',
            checked: true,
          },
          {
            name: 'reminderType',
            type: 'radio',
            label: this.tr('home.dialog.reminderRadio2'),
            value: '2days',
          },
          {
            name: 'reminderType',
            type: 'radio',
            label: this.tr('home.dialog.reminderRadioOvulation'),
            value: 'ovulation',
          },
          {
            name: 'reminderType',
            type: 'radio',
            label: this.tr('home.dialog.reminderRadioDaily'),
            value: 'daily',
          },
        ],
        buttons: [
          {
            text: this.tr('home.common.cancel'),
            role: 'cancel',
          },
          {
            text: this.tr('home.dialog.setReminder'),
            handler: async (data) => {
              if (data) {
                await this.scheduleFertilityReminder(results, data);
              }
            },
          },
        ],
      });

      await reminderAlert.present();
    } catch (error) {
      console.error('Error setting fertility reminder:', error);
      await this.showToast(this.tr('home.dialog.reminderSetFailed'), 'danger');
    }
  }

  // Schedule fertility reminder
  private async scheduleFertilityReminder(
    results: FertilityResults,
    reminderType: string
  ) {
    try {
      // Calculate reminder dates
      const ovulationDate = new Date(results.ovulationDay);
      const fertileStartDate = new Date(results.fertileDays[0]);

      let reminderDate: Date;
      let reminderMessage: string;

      switch (reminderType) {
        case '1day':
          reminderDate = new Date(fertileStartDate);
          reminderDate.setDate(reminderDate.getDate() - 1);
          reminderMessage = this.tr('home.dialog.reminderMsg1day');
          break;
        case '2days':
          reminderDate = new Date(fertileStartDate);
          reminderDate.setDate(reminderDate.getDate() - 2);
          reminderMessage = this.tr('home.dialog.reminderMsg2days');
          break;
        case 'ovulation':
          reminderDate = ovulationDate;
          reminderMessage = this.tr('home.dialog.reminderMsgOvulation');
          break;
        case 'daily':
          reminderMessage = this.tr('home.dialog.reminderMsgDaily');
          break;
        default:
          reminderDate = new Date(fertileStartDate);
          reminderMessage = this.tr('home.dialog.reminderMsgDefault');
      }

      // Store reminder in localStorage (in a real app, you'd use proper notification scheduling)
      const reminders = JSON.parse(
        localStorage.getItem('fertilityReminders') || '[]'
      );

      if (reminderType === 'daily') {
        // Add daily reminders for each fertile day
        results.fertileDays.forEach((day, index) => {
          const dayDate = new Date(day);
          reminders.push({
            id: `fertility_daily_${index}_${Date.now()}`,
            date: dayDate.toISOString().split('T')[0],
            message: this.tr('home.dialog.reminderDailyIndexed', {
              day: index + 1,
            }),
            type: 'fertility',
            isActive: true,
            createdAt: new Date().toISOString(),
          });
        });
      } else {
        reminders.push({
          id: `fertility_${reminderType}_${Date.now()}`,
          date: reminderDate!.toISOString().split('T')[0],
          message: reminderMessage,
          type: 'fertility',
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }

      localStorage.setItem('fertilityReminders', JSON.stringify(reminders));

      // Show success message
      const successAlert = await this.alertController.create({
        header: this.tr('home.alert.reminderSetHeader'),
        message: this.tr('home.dialog.reminderSetSuccessBody'),
        buttons: [
          {
            text: this.tr('home.dialog.viewAllReminders'),
            handler: () => {
              this.showAllReminders();
            },
          },
          {
            text: this.tr('home.dialog.done'),
            role: 'cancel',
          },
        ],
      });

      await successAlert.present();
      await this.showToast(
        this.tr('home.dialog.reminderToastSuccess'),
        'success'
      );
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      await this.showToast(
        this.tr('home.dialog.reminderScheduleFailed'),
        'danger'
      );
    }
  }

  // Show all reminders
  private async showAllReminders() {
    try {
      const reminders = JSON.parse(
        localStorage.getItem('fertilityReminders') || '[]'
      );
      const activeReminders = reminders.filter((r: any) => r.isActive);

      if (activeReminders.length === 0) {
        await this.showToast(
          this.tr('home.dialog.noActiveReminders'),
          'warning'
        );
        return;
      }

      const remindersList = activeReminders
        .map((reminder: any) => {
          const date = new Date(reminder.date).toLocaleDateString(
            this.dateLocaleTag(),
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }
          );
          return `• ${date}: ${reminder.message}`;
        })
        .join('\n');

      const remindersAlert = await this.alertController.create({
        header: this.tr('home.alert.remindersListHeader'),
        message: this.tr('home.dialog.activeRemindersIntro', {
          list: remindersList,
        }),
        buttons: [
          {
            text: this.tr('home.dialog.clearAll'),
            handler: () => {
              this.clearAllReminders();
            },
          },
          {
            text: this.tr('home.dialog.done'),
            role: 'cancel',
          },
        ],
      });

      await remindersAlert.present();
    } catch (error) {
      console.error('Error showing reminders:', error);
      await this.showToast(
        this.tr('home.dialog.loadRemindersFailed'),
        'danger'
      );
    }
  }

  // Clear all reminders
  private async clearAllReminders() {
    try {
      const confirmAlert = await this.alertController.create({
        header: this.tr('home.alert.clearRemindersHeader'),
        message: this.tr('home.alert.clearRemindersMessage'),
        buttons: [
          {
            text: this.tr('home.common.cancel'),
            role: 'cancel',
          },
          {
            text: this.tr('home.dialog.clearAll'),
            handler: () => {
              localStorage.removeItem('fertilityReminders');
              this.showToast(
                this.tr('home.dialog.allRemindersCleared'),
                'success'
              );
            },
          },
        ],
      });

      await confirmAlert.present();
    } catch (error) {
      console.error('Error clearing reminders:', error);
      await this.showToast(
        this.tr('home.dialog.clearRemindersFailed'),
        'danger'
      );
    }
  }

  // Export fertility results
  private async exportFertilityResults(results: FertilityResults) {
    try {
      // Check if user is on mobile device first
      const isMobile = this.detectMobileDevice();

      // Only allow sharing on mobile devices
      if (!isMobile) {
        await this.showToast(this.tr('home.dialog.shareMobileOnly'), 'warning');
        return;
      }

      const shareText = `🧮 Elahiiiiiiiiiiii My Fertility Calendar

📅 Cycle Information:
• Cycle Length: ${results.cycleLength} days
• Last Period: ${results.lastPeriodDate}

🌟 Most Fertile Days:
${results.fertileDays.map((day) => `• ${day}`).join('\n')}

🥚 Ovulation Day: ${results.ovulationDay}
📅 Next Period Expected: ${results.nextPeriod}

💡 These are estimates based on cycle data. Track symptoms daily for better accuracy!

Generated by NouraCare App To Elahi Fatat besham Azizam`;

      // Check if Web Share API is supported
      const isHTTPS = window.location.protocol === 'https:';
      const canShare =
        'share' in navigator &&
        (isHTTPS || window.location.hostname === 'localhost');

      if (canShare) {
        try {
          await navigator.share({
            title: 'My Fertility Calendar',
            text: shareText,
          });
          await this.showToast(this.tr('home.dialog.resultsShared'), 'success');
        } catch (shareError) {
          console.log('Native share failed, using fallback:', shareError);
          await this.fallbackShare(shareText, isMobile);
        }
      } else {
        await this.fallbackShare(shareText, isMobile);
      }
    } catch (error) {
      console.error('Error sharing results:', error);
      await this.showToast(this.tr('home.dialog.shareFailed'), 'danger');
    }
  }

  // Fallback share methods
  private async fallbackShare(shareText: string, isMobile: boolean) {
    try {
      if (isMobile) {
        // Mobile fallback: Show options for different sharing methods
        const shareAlert = await this.alertController.create({
          header: this.tr('home.alert.shareResultsHeader'),
          message: this.tr('home.dialog.shareChooseMethod'),
          buttons: [
            {
              text: this.tr('home.dialog.copyClipboard'),
              handler: async () => {
                await this.copyToClipboard(shareText);
              },
            },
            {
              text: this.tr('home.dialog.smsWhatsapp'),
              handler: () => {
                this.shareViaSMS(shareText);
              },
            },
            {
              text: this.tr('home.dialog.email'),
              handler: () => {
                this.shareViaEmail(shareText);
              },
            },
            {
              text: this.tr('home.common.cancel'),
              role: 'cancel',
            },
          ],
        });
        await shareAlert.present();
      } else {
        // Desktop fallback: Copy to clipboard
        await this.copyToClipboard(shareText);
      }
    } catch (error) {
      console.error('Fallback share failed:', error);
      await this.showToast(this.tr('home.dialog.shareUnable'), 'danger');
    }
  }

  // Copy to clipboard with better error handling
  private async copyToClipboard(text: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        await this.showToast(this.tr('home.dialog.copySuccess'), 'success');
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          await this.showToast(this.tr('home.dialog.copySuccess'), 'success');
        } catch (err) {
          await this.showToast(this.tr('home.dialog.copyManual'), 'warning');
          // Show the text in an alert for manual copying
          const textAlert = await this.alertController.create({
            header: this.tr('home.alert.copyTextHeader'),
            message: `<div style="font-family: monospace; font-size: 12px; text-align: left; white-space: pre-line; max-height: 300px; overflow-y: auto;">${text}</div>`,
            buttons: [{ text: this.tr('home.common.ok'), role: 'cancel' }],
          });
          await textAlert.present();
        }

        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      await this.showToast(this.tr('home.dialog.copyFailed'), 'danger');
    }
  }

  // Share via SMS/WhatsApp (mobile)
  private shareViaSMS(text: string) {
    try {
      const encodedText = encodeURIComponent(text);
      // Try WhatsApp first (more popular), then fallback to SMS
      const whatsappUrl = `https://wa.me/?text=${encodedText}`;
      const smsUrl = `sms:?body=${encodedText}`;

      // Try WhatsApp first
      window.open(whatsappUrl, '_blank');

      // Fallback to SMS after a short delay if WhatsApp doesn't work
      setTimeout(() => {
        const fallbackAlert = this.alertController.create({
          header: this.tr('home.alert.altShareHeader'),
          message: this.tr('home.dialog.altShareMessage'),
          buttons: [
            {
              text: this.tr('home.dialog.openSms'),
              handler: () => {
                window.open(smsUrl, '_blank');
              },
            },
            {
              text: this.tr('home.common.cancel'),
              role: 'cancel',
            },
          ],
        });
        fallbackAlert.then((alert) => alert.present());
      }, 2000);
    } catch (error) {
      console.error('SMS share failed:', error);
      this.showToast(this.tr('home.dialog.unableOpenMessaging'), 'danger');
    }
  }

  // Share via Email
  private shareViaEmail(text: string) {
    try {
      const subject = encodeURIComponent(
        this.tr('home.dialog.emailSubjectFertility')
      );
      const body = encodeURIComponent(text);
      const emailUrl = `mailto:?subject=${subject}&body=${body}`;

      window.open(emailUrl, '_blank');
      this.showToast(this.tr('home.dialog.openingEmailApp'), 'success');
    } catch (error) {
      console.error('Email share failed:', error);
      this.showToast(this.tr('home.dialog.unableOpenEmail'), 'danger');
    }
  }

  async openNutritionTracker() {
    try {
      await this.showToast(this.tr('home.dialog.openingNutrition'), 'success');

      const nutritionAlert = await this.alertController.create({
        header: this.tr('home.alert.nutritionHeader'),
        message: this.tr('home.dialog.nutritionBody'),
        buttons: [
          {
            text: this.tr('home.dialog.startTracking'),
            handler: () => {
              this.router.navigate(['/tabs/insights']);
            },
          },
          {
            text: this.tr('home.common.continue'),
            role: 'cancel',
          },
        ],
      });

      await nutritionAlert.present();
    } catch (error) {
      await this.showToast(
        this.tr('home.dialog.nutritionOpenFailed'),
        'danger'
      );
    }
  }

  async openExercisePlanner() {
    try {
      await this.showToast(this.tr('home.dialog.openingExercise'), 'success');

      const exerciseAlert = await this.alertController.create({
        header: this.tr('home.alert.exerciseHeader'),
        message: this.tr('home.dialog.exerciseBody'),
        buttons: [
          {
            text: this.tr('home.dialog.viewExercises'),
            handler: () => {
              this.router.navigate(['/tabs/insights']);
            },
          },
          {
            text: this.tr('home.common.continue'),
            role: 'cancel',
          },
        ],
      });

      await exerciseAlert.present();
    } catch (error) {
      await this.showToast(this.tr('home.dialog.exerciseOpenFailed'), 'danger');
    }
  }

  async openMedicationReminder() {
    try {
      await this.showToast(this.tr('home.dialog.openingMedication'), 'success');

      const medicationAlert = await this.alertController.create({
        header: this.tr('home.alert.medicationHeader'),
        message: this.tr('home.dialog.medicationBody'),
        buttons: [
          {
            text: this.tr('home.dialog.setRemindersBtn'),
            handler: () => {
              this.router.navigate(['/tabs/insights']);
            },
          },
          {
            text: this.tr('home.common.continue'),
            role: 'cancel',
          },
        ],
      });

      await medicationAlert.present();
    } catch (error) {
      await this.showToast(
        this.tr('home.dialog.medicationOpenFailed'),
        'danger'
      );
    }
  }

  // Postpartum-specific methods
  async openFeedingTracker() {
    try {
      await this.showToast(this.tr('home.dialog.openingFeeding'), 'success');

      const feedingAlert = await this.alertController.create({
        header: this.tr('home.alert.feedingHeader'),
        message: this.tr('home.dialog.feedingBody'),
        buttons: [
          {
            text: this.tr('home.dialog.startTracking'),
            handler: () => {
              this.router.navigate(['/tools']);
            },
          },
          {
            text: this.tr('home.common.continue'),
            role: 'cancel',
          },
        ],
      });

      await feedingAlert.present();
    } catch (error) {
      await this.showToast(this.tr('home.dialog.feedingOpenFailed'), 'danger');
    }
  }

  async openSleepTracker() {
    try {
      await this.showToast(this.tr('home.dialog.openingSleep'), 'success');

      const sleepAlert = await this.alertController.create({
        header: this.tr('home.alert.sleepHeader'),
        message: this.tr('home.dialog.sleepBody'),
        buttons: [
          {
            text: this.tr('home.dialog.startTracking'),
            handler: () => {
              this.router.navigate(['/tools']);
            },
          },
          {
            text: this.tr('home.common.continue'),
            role: 'cancel',
          },
        ],
      });

      await sleepAlert.present();
    } catch (error) {
      await this.showToast(this.tr('home.dialog.sleepOpenFailed'), 'danger');
    }
  }

  // Helper methods for pregnancy tracker
  getWeeksArray(): number[] {
    return Array.from({ length: 40 }, (_, i) => i + 1);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  getTotalAvailableSymptoms(): number {
    // Get total count of available symptoms from the tracker
    // This should match the total count from symptoms-tracker component
    const sexDriveOptions = [
      'masturbation',
      'no_sex',
      'protected_sex',
      'unprotected_sex',
      'high_sex_drive',
      'low_sex_drive',
    ];

    const moodOptions = [
      'calm',
      'happy',
      'energetic',
      'frisky',
      'mood_swings',
      'irritated',
      'sad',
      'anxious',
      'depressed',
      'guilty',
      'obsessive',
      'low_energy',
      'apathetic',
      'confused',
      'self_critical',
    ];

    const physicalSymptoms = [
      'breast_tenderness',
      'headache',
      'leg_cramps',
      'back_pain',
      'morning_sickness',
      'heartburn',
      'fatigue',
      'nausea',
      'bloating',
      'cramps',
    ];

    return (
      sexDriveOptions.length + moodOptions.length + physicalSymptoms.length
    );
  }

  /** Log / change last period on the dedicated cycle calendar (not the home date picker). */
  openPeriodDatePicker(): void {
    void this.router.navigate(['/cycle-calendar']);
  }

  showPregnancyDetails() {
    this.viewPregnancyDetails();
  }

  getWeekDays(): any[] {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const days = [];

    // Get the start of the current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);

      days.push({
        date: dayDate.getDate(),
        isSelected:
          dayDate.getDate() === today.getDate() &&
          dayDate.getMonth() === today.getMonth() &&
          dayDate.getFullYear() === today.getFullYear(),
        fullDate: dayDate,
      });
    }

    return days;
  }

  selectDay(day: any) {
    // Update all days to not selected
    this.getWeekDays().forEach((d) => (d.isSelected = false));

    // Set the clicked day as selected
    day.isSelected = true;

    // Preview the tapped day only; keep week/day convention 1-based and never mutate stored LMP.
    const selectedDate = day.fullDate;
    const pregnancyStartDate = new Date(this.pregnancyStartDate);
    const diffTime = Math.abs(
      selectedDate.getTime() - pregnancyStartDate.getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.pregnancyDays = diffDays;
    this.pregnancyWeek = Math.min(
      42,
      Math.max(1, Math.floor(diffDays / 7) + 1)
    );
    this.pregnancyDayInWeek = diffDays % 7;
    this.pregnancyProgress = Math.min(100, Math.round((diffDays / 280) * 100));

    // Update baby size data
    this.updateBabySize();
  }

  getWeeksForDisplay(): any[][] {
    const weeks = [];
    const today = new Date();

    // Generate 8 weeks (4 weeks before current + current week + 3 weeks after)
    for (let weekOffset = -4; weekOffset <= 3; weekOffset++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7);

      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);

        weekDays.push({
          date: dayDate.getDate(),
          isSelected:
            dayDate.getDate() === today.getDate() &&
            dayDate.getMonth() === today.getMonth() &&
            dayDate.getFullYear() === today.getFullYear(),
          isToday:
            dayDate.getDate() === today.getDate() &&
            dayDate.getMonth() === today.getMonth() &&
            dayDate.getFullYear() === today.getFullYear(),
          fullDate: dayDate,
        });
      }
      weeks.push(weekDays);
    }

    return weeks;
  }

  previousWeek() {
    this.currentWeekOffset--;
    // Trigger change detection
    this.getWeeksForDisplay();
  }

  nextWeek() {
    this.currentWeekOffset++;
    // Trigger change detection
    this.getWeeksForDisplay();
  }

  selectWeek(week: number) {
    const w = Math.min(42, Math.max(1, Math.round(Number(week) || 1)));
    this.pregnancyWeek = w;
    this.pregnancyDays = (w - 1) * 7;
    this.pregnancyDayInWeek = 0;
    this.pregnancyProgress = Math.min(
      100,
      Math.round((this.pregnancyDays / 280) * 100)
    );
    this.updateBabySize();
  }

  onDateChange(event: any) {
    const selectedDate = new Date(event.detail.value);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - selectedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.pregnancyDays = diffDays;
    this.pregnancyWeek = Math.min(
      42,
      Math.max(1, Math.floor(diffDays / 7) + 1)
    );
    this.pregnancyDayInWeek = diffDays % 7;
    this.pregnancyProgress = Math.min(100, Math.round((diffDays / 280) * 100));

    // Update baby size data
    this.updateBabySize();
  }

  getBabyDevelopment(week: number): string {
    // Realistic baby development stages with more detail
    if (week <= 4) return '🥚'; // Fertilized egg
    if (week <= 8) return '🫘'; // Embryo
    if (week <= 12) return '👶'; // Early fetus
    if (week <= 16) return '👶'; // Developing fetus
    if (week <= 20) return '👶'; // More developed fetus
    if (week <= 24) return '👶'; // Viable fetus
    if (week <= 28) return '👶'; // Growing fetus
    if (week <= 32) return '👶'; // Almost full term
    if (week <= 36) return '👶'; // Near term
    return '👶'; // Full term
  }

  getBabyEmoji(week: number): string {
    const emojis = [
      '🌱',
      '🌱',
      '🌱',
      '🌱', // Weeks 1-4
      '🫘',
      '🫘',
      '🫘',
      '🫘', // Weeks 5-8
      '🫐',
      '🫐',
      '🫐',
      '🫐', // Weeks 9-12
      '🍊',
      '🍊',
      '🍊',
      '🍊', // Weeks 13-16
      '🍑',
      '🍑',
      '🍑',
      '🍑', // Weeks 17-20
      '🍎',
      '🍎',
      '🍎',
      '🍎', // Weeks 21-24
      '🥑',
      '🥑',
      '🥑',
      '🥑', // Weeks 25-28
      '🍐',
      '🍐',
      '🍐',
      '🍐', // Weeks 29-32
      '🎃',
      '🎃',
      '🎃',
      '🎃', // Weeks 33-36
      '🍉',
      '🍉',
      '🍉',
      '🍉', // Weeks 37-40
    ];

    return emojis[Math.min(week - 1, emojis.length - 1)] || '👶';
  }

  updateBabySize() {
    // Baby size data is now automatically computed via getters
    // No need to manually update as it's reactive to pregnancyWeek changes
  }

  // Utility method to show toast messages
  async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom',
    });
    await toast.present();
  }

  tabChanged() {
    // Handle tab changes if needed
  }

  // Cycle day methods
  getCycleWelcomeName(): string {
    const raw = (this.userName || '').trim();
    if (!raw) return 'Sarah';
    const first = raw.split(/\s+/)[0];
    return first || 'Sarah';
  }

  getCycleDisplayDay(): number {
    if (this.currentCycleDay <= 0) return 1;
    return Math.min(this.currentCycleDay, this.currentCycleLength);
  }

  getCycleProgressPercent(): number {
    const safeLen = Math.max(1, this.currentCycleLength || 28);
    const safeDay = this.getCycleDisplayDay();
    return Math.max(0, Math.min(100, (safeDay / safeLen) * 100));
  }

  getNextPeriodInDays(): number {
    if (this.dashboardNextPeriodDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const next = new Date(this.dashboardNextPeriodDate);
      next.setHours(0, 0, 0, 0);
      const diff = Math.ceil((next.getTime() - today.getTime()) / 86400000);
      return Math.max(0, diff);
    }
    const safeLen = Math.max(1, this.currentCycleLength || 28);
    const safeDay = this.getCycleDisplayDay();
    const remaining = safeLen - safeDay;
    return remaining <= 0 ? safeLen : remaining;
  }

  getFertileWindowDays(): number {
    return 5;
  }

  getOvulationSummary(): string {
    const safeLen = Math.max(1, this.currentCycleLength || 28);
    const safeDay = this.getCycleDisplayDay();
    const ovulationDay = Math.max(1, safeLen - 14);
    const diff = ovulationDay - safeDay;
    if (diff === 0) return this.tr('home.ovulation.today');
    if (diff > 0) return this.tr('home.ovulation.inDays', { days: diff });
    return this.tr('home.ovulation.daysAgo', { days: Math.abs(diff) });
  }

  getCycleDayStatus(): string {
    if (this.currentCycleDay <= 0)
      return this.tr('home.cycleStatus.notTracking');
    if (this.currentCycleDay <= this.periodLength)
      return this.tr('home.cycleStatus.periodDay');
    if (this.currentCycleDay <= 14)
      return this.tr('home.cycleStatus.follicular');
    if (this.currentCycleDay <= 28) return this.tr('home.cycleStatus.luteal');
    return this.tr('home.cycleStatus.nextCycle');
  }

  getCycleDayDescription(): string {
    if (this.currentCycleDay <= 0) return this.tr('home.cycleDesc.notTracking');
    if (this.currentCycleDay <= this.periodLength)
      return this.tr('home.cycleDesc.period', { day: this.currentCycleDay });
    if (this.currentCycleDay <= 14) return this.tr('home.cycleDesc.follicular');
    if (this.currentCycleDay <= 28) return this.tr('home.cycleDesc.luteal');
    return this.tr('home.cycleDesc.next');
  }

  getCycleGreetingEyebrow(): string {
    const h = new Date().getHours();
    if (h < 12) return this.tr('home.cycleGreetingMorning');
    if (h < 17) return this.tr('home.cycleGreetingAfternoon');
    return this.tr('home.cycleGreetingEvening');
  }

  getCyclePhaseTone():
    | 'none'
    | 'period'
    | 'follicular'
    | 'fertile'
    | 'luteal' {
    if (this.dashboardPhaseGuide?.phase) {
      return this.dashboardPhaseGuide.phase;
    }
    if (this.currentCycleDay <= 0) return 'none';
    const plen = Math.max(1, this.periodLength || 5);
    const len = Math.max(1, this.currentCycleLength || 28);
    const day = this.getCycleDisplayDay();
    const ovulationDay = Math.max(plen + 1, len - 14);
    const fertileStart = Math.max(plen + 1, ovulationDay - 5);
    const fertileEnd = ovulationDay + 1;
    if (day <= plen) return 'period';
    if (day >= fertileStart && day <= fertileEnd) return 'fertile';
    if (day < ovulationDay) return 'follicular';
    return 'luteal';
  }

  /** Which period marker (1…periodLength) to bold on the home cycle ring. */
  getChartPeriodHighlightDay(): number | null {
    if (this.currentCycleDay <= 0 || this.currentCycleDay > this.periodLength) {
      return null;
    }
    return this.currentCycleDay;
  }

  getCyclePeriodStatValue(): string {
    if (this.currentCycleDay <= 0) {
      return '—';
    }
    if (this.currentCycleDay <= this.periodLength) {
      return this.tr('home.cycleStatPeriodDayValue', {
        day: this.currentCycleDay,
        total: this.periodLength,
      });
    }
    const days = this.getNextPeriodInDays();
    if (days === 0) return this.tr('home.ovulation.today');
    return this.tr('home.cycleStatPeriodInValue', { days });
  }

  getCyclePeriodStatLabel(): string {
    if (this.currentCycleDay <= 0) {
      return this.tr('home.cycleStatPeriod');
    }
    if (this.currentCycleDay <= this.periodLength) {
      return this.tr('home.cycleStatPeriodDayCaption');
    }
    return this.tr('home.cycleStatPeriodNext');
  }

  getCycleDayStatValue(): string {
    if (this.currentCycleDay <= 0) return '—';
    return this.tr('home.cycleStatDayOfValue', {
      day: this.getCycleDisplayDay(),
      len: Math.max(1, this.currentCycleLength || 28),
    });
  }

  getCyclePhaseGuideHeadline(): string {
    return this.tr(`home.cycleGuide.${this.getCyclePhaseTone()}.headline`);
  }

  getCyclePhaseGuideSubtitle(): string {
    return this.getCycleTodayAdvice();
  }

  getCycleTodayAdvice(): string {
    const tone = this.getCyclePhaseTone();
    if (tone === 'none' || this.currentCycleDay <= 0) {
      return this.tr('home.cycleToday.none');
    }

    const plen = Math.max(1, this.periodLength || 5);
    const day = this.currentCycleDay;

    if (tone === 'period') {
      if (day === 1) {
        return this.tr('home.cycleToday.period.day1');
      }
      if (day === 2) {
        return this.tr('home.cycleToday.period.day2');
      }
      if (day >= plen) {
        return this.tr('home.cycleToday.period.lastDay', { day });
      }
      return this.tr('home.cycleToday.period.mid', { day, total: plen });
    }

    if (tone === 'follicular') {
      return this.tr('home.cycleToday.follicular', {
        day: this.getCycleDisplayDay(),
      });
    }

    if (tone === 'fertile') {
      const ovulationDay = Math.max(
        plen + 1,
        Math.max(1, this.currentCycleLength || 28) - 14,
      );
      if (this.getCycleDisplayDay() === ovulationDay) {
        return this.tr('home.cycleToday.fertile.ovulationDay');
      }
      return this.tr('home.cycleToday.fertile.window');
    }

    const daysUntil = this.getNextPeriodInDays();
    if (daysUntil <= 0) {
      return this.tr('home.cycleToday.luteal.soon');
    }
    if (daysUntil <= 3) {
      return this.tr('home.cycleToday.luteal.soonDays', { days: daysUntil });
    }
    return this.tr('home.cycleToday.luteal.mid', { days: daysUntil });
    
  }

  getCyclePhaseGuideCards(): DashboardCyclePhaseGuideCard[] {
    const translated = this.buildFallbackCycleGuideCards();
    const fromApi = this.dashboardPhaseGuide?.cards;
    if (!fromApi?.length) {
      return translated;
    }
    return translated.map((card, index) => {
      const apiCard = fromApi[index];
      if (!apiCard) {
        return card;
      }
      return {
        ...card,
        id: apiCard.id,
        ionIcon: apiCard.ionIcon,
        accentHex: apiCard.accentHex,
        action: apiCard.action ?? card.action,
      };
    });
  }

  private buildFallbackCycleGuideCards(): DashboardCyclePhaseGuideCard[] {
    const tone = this.getCyclePhaseTone();
    const p = `home.cycleGuide.${tone}`;
    return [
      {
        id: `${tone}-1`,
        ionIcon: 'sparkles-outline',
        accentHex: '#db2777',
        title: this.tr(`${p}.card1Title`),
        body: this.tr(`${p}.card1Body`),
        action: tone === 'fertile' ? 'fertility' : 'symptoms',
      },
      {
        id: `${tone}-2`,
        ionIcon: 'book-outline',
        accentHex: '#0d9488',
        title: this.tr(`${p}.card2Title`),
        body: this.tr(`${p}.card2Body`),
        action: 'insights',
      },
      {
        id: `${tone}-3`,
        ionIcon: 'calendar-outline',
        accentHex: '#9333ea',
        title: this.tr(`${p}.card3Title`),
        body: this.tr(`${p}.card3Body`),
        action: tone === 'none' ? 'period' : 'calendar',
      },
    ];
  }

  onCycleGuideCardAction(
    action: 'insights' | 'fertility' | 'symptoms' | 'calendar' | 'period',
  ): void {
    switch (action) {
      case 'insights':
        this.openCycleInsightsFromHome();
        break;
      case 'fertility':
        void this.openFertilityCalculator();
        break;
      case 'symptoms':
        void this.openSymptomsTracking();
        break;
      case 'calendar':
        this.openCycleCalendar();
        break;
      case 'period':
        this.openPeriodDatePicker();
        break;
    }
  }

  updateCycleDay() {
    if (!this.periodStartDate) {
      this.currentCycleDay = 0;
      return;
    }

    const selectedKey = this.cycleSettings.selectedCycleViewDate();
    let today: Date;
    if (selectedKey) {
      const parts = selectedKey.split('-').map((p) => Number(p));
      if (parts.length === 3 && !parts.some((n) => Number.isNaN(n))) {
        today = new Date(parts[0], parts[1], parts[2]);
      } else {
        today = new Date();
      }
    } else {
      today = new Date();
    }
    const startDate = new Date(this.periodStartDate);
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const safeLen = Math.max(1, this.currentCycleLength || 28);
    const mod = ((diffDays % safeLen) + safeLen) % safeLen;
    this.currentCycleDay = mod + 1; // 1-based cycle day for selected/today date
  }

  // Detect if user is on mobile device
  private detectMobileDevice(): boolean {
    // Check for mobile device using multiple methods
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for mobile user agents
    const isMobileUserAgent =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );

    // Check for touch capability
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check screen width (mobile-like width)
    const isMobileWidth = window.innerWidth <= 768;

    // Check if Web Share API is supported (typically mobile)
    const hasWebShare = 'share' in navigator;

    // Device is considered mobile if it meets multiple criteria
    return isMobileUserAgent && (isTouchDevice || isMobileWidth || hasWebShare);
  }

  // Enhanced User Experience Methods
  getGreetingMessage(): string {
    const hour = new Date().getHours();
    if (hour < 12) return this.tr('home.greeting.morning');
    if (hour < 17) return this.tr('home.greeting.afternoon');
    return this.tr('home.greeting.evening');
  }

  getPersonalizedMessage(): string {
    if (this.isPregnant()) {
      return this.tr('home.personalized.pregnant', {
        week: this.getPregnancyDisplayWeek(),
        day: this.getPregnancyDayDisplay(),
      });
    }
    if (this.isHomeCycleTrackingLayout()) {
      return this.tr('home.personalized.cycle', { day: this.currentCycleDay });
    }
    if (this.isPostpartum) {
      return this.tr('home.personalized.postpartum');
    }
    return this.tr('home.personalized.default');
  }

  getStatusIcon(): string {
    if (this.isPregnant()) return 'heart';
    if (this.isHomeCycleTrackingLayout()) return 'analytics';
    if (this.isPostpartum) return 'flower';
    return 'calendar';
  }

  getStatusIconClass(): string {
    if (this.isPregnant()) return 'pregnant-status';
    if (this.isHomeCycleTrackingLayout()) return 'ttc-status';
    if (this.isPostpartum) return 'postpartum-status';
    return 'default-status';
  }

  getStatusTitle(): string {
    if (this.isPregnant())
      return `Week ${this.getPregnancyDisplayWeek()}, day ${this.getPregnancyDayDisplay()}`;
    if (this.isHomeCycleTrackingLayout()) return 'Tracking Fertility';
    if (this.isPostpartum) return 'Postpartum Care';
    return 'Start Tracking';
  }

  getStatusDescription(): string {
    if (this.isPregnant()) return `Your baby is growing beautifully!`;
    if (this.isHomeCycleTrackingLayout())
      return `Day ${this.currentCycleDay} of your cycle`;
    if (this.isPostpartum) return 'Focus on recovery and bonding';
    return 'Set up your profile to start tracking';
  }

  openCurrentPregnancyWeekDetail(): void {
    this.router.navigate(['/week-detail'], {
      queryParams: { week: this.getPregnancyWeekDetailRouteParam() },
    });
  }

  /** 1-based gestational week since LMP (same as dashboard `week`). */
  getPregnancyDisplayWeek(): number {
    if (!this.isPregnant()) {
      return this.pregnancyWeek;
    }
    if (this.pregnancyCalendarViewDate) {
      return this.computePregnancyWeekForDate(this.pregnancyCalendarViewDate);
    }
    const d = this.getPregnancyFullDaysSinceLmpUtcToday();
    if (d !== null) {
      return Math.min(42, Math.max(1, Math.floor(d / 7) + 1));
    }
    return this.pregnancyWeek;
  }

  /** Week 41+ (after completed week 40) — show full-term reassurance UI. */
  isPregnancyPostDueWindow(): boolean {
    if (!this.isPregnant() || this.needsPregnancyInput) {
      return false;
    }
    return this.getPregnancyDisplayWeek() > 40;
  }

  /** Day within current pregnancy week (0–6), or from calendar pick. */
  getPregnancyDayDisplay(): number {
    if (!this.isPregnant()) {
      return 0;
    }
    if (!this.pregnancyCalendarViewDate) {
      const d = this.getPregnancyFullDaysSinceLmpUtcToday();
      if (d !== null) {
        return d % 7;
      }
      return this.pregnancyDayInWeek;
    }
    const d = this.getCalendarDaysSinceLmp(this.pregnancyCalendarViewDate);
    if (d === null) {
      return this.pregnancyDayInWeek;
    }
    return d % 7;
  }

  /** 1–7 for display (“Day 3 of 7 this week”) — `getPregnancyDayDisplay()` is 0–6. */
  getPregnancyDayInWeekHuman(): number {
    return Math.min(7, Math.max(1, this.getPregnancyDayDisplay() + 1));
  }

  /** “week along” vs “weeks along” for the hero headline. */
  getPregnancyWeekAlongUnit(): string {
    return this.getPregnancyDisplayWeek() === 1 ? 'week along' : 'weeks along';
  }

  /** Small label inside the circular week button (“week” / “weeks”). */
  getPregnancyWeekBadgeSuffix(): string {
    return this.getPregnancyDisplayWeek() === 1 ? 'week' : 'weeks';
  }

  /** 0–100 for pregnancy journey (hero ring + any other UI). */
  getPregnancyProgressBarPercent(): number {
    return Math.min(100, Math.max(0, Number(this.pregnancyProgress) || 0));
  }

  private getPregnancyHeroRingCircumference(): number {
    return 2 * Math.PI * this.pregnancyHeroRingRadius;
  }

  /** Full dash length for SVG ring (`stroke-dasharray`). */
  getPregnancyProgressRingDasharray(): string {
    return String(this.getPregnancyHeroRingCircumference());
  }

  /** Reveals `getPregnancyProgressBarPercent()` of the ring from the top (after -90° rotation). */
  getPregnancyProgressRingDashoffset(): number {
    const c = this.getPregnancyHeroRingCircumference();
    return c * (1 - this.getPregnancyProgressBarPercent() / 100);
  }

  /**
   * Week chip sits on the ring at the **end of the progress arc** (same direction as the stroke:
   * from 12 o’clock, clockwise). Coordinates match the hero SVG viewBox (0–100) and its
   * `inset: -7px` / `calc(100% + 14px)` layout (matches `.pregnancy-hero-progress-ring`).
   */
  getPregnancyHeroRingWeekBadgeStyle(): Record<string, string> {
    const p = this.getPregnancyProgressBarPercent() / 100;
    const theta = -Math.PI / 2 + 2 * Math.PI * p;
    const r = this.pregnancyHeroRingRadius;
    const xVb = 50 + r * Math.cos(theta);
    const yVb = 50 + r * Math.sin(theta);
    return {
      left: `calc(-7px + ${xVb / 100} * (100% + 14px))`,
      top: `calc(-7px + ${yVb / 100} * (100% + 14px))`,
      transform: 'translate(-50%, -50%)',
    };
  }

  /**
   * Trimester boundaries on the ring (week 13 and 27 of 40 ≈ 32.5% and 67.5% of the journey).
   * Shown as small reference dots on the track.
   */
  getPregnancyRingMilestoneDots(): { cx: number; cy: number; key: number }[] {
    const r = this.pregnancyHeroRingRadius;
    return [32.5, 67.5].map((pct) => {
      const t = -Math.PI / 2 + (2 * Math.PI * pct) / 100;
      return {
        cx: 50 + r * Math.cos(t),
        cy: 50 + r * Math.sin(t),
        key: pct,
      };
    });
  }

  /** Plain-language value for the circular progress control. */
  getPregnancyProgressRingAriaValuetext(): string {
    const pct = Math.round(this.getPregnancyProgressBarPercent());
    const w = Math.max(1, this.getPregnancyDisplayWeek());
    return `Week ${w}, about ${pct} percent through pregnancy`;
  }

  getPregnancyWeekDetailRouteParam(): number {
    const w = this.getPregnancyDisplayWeek();
    return Math.min(40, Math.max(1, w));
  }

  /**
   * LMP `YYYY-MM-DD` → UTC ms at that civil date 00:00 UTC (matches server date-only LMP).
   * When pregnant, falls back to cycle last-period start so hero week/day match before dashboard fills `pregnancyStartDate`.
   */
  private getLmpUtcMidnightMs(): number | null {
    const head =
      isoDateOnly(this.pregnancyStartDate) ??
      (this.isPregnant()
        ? normalizeLmpInput(this.cycleSettings.lastPeriodStartDate())
        : null);
    if (!head) {
      return null;
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(head);
    if (!m) {
      return null;
    }
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  /** Full days since LMP through “today” in UTC civil date (same basis as `recomputePregnancyStatsFromLmpIfAvailable`). */
  private getPregnancyFullDaysSinceLmpUtcToday(): number | null {
    const u0 = this.getLmpUtcMidnightMs();
    if (u0 === null) {
      return null;
    }
    const now = new Date();
    const u1 = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );
    if (u1 < u0) {
      return null;
    }
    return Math.floor((u1 - u0) / 86400000);
  }

  private getCalendarDaysSinceLmp(ref: Date): number | null {
    const u0 = this.getLmpUtcMidnightMs();
    if (u0 === null) {
      return null;
    }
    const u1 = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
    if (u1 < u0) {
      return null;
    }
    return Math.floor((u1 - u0) / 86400000);
  }

  /**
   * 1-based gestational week for a calendar day vs `pregnancyStartDate` (aligned with server dashboard).
   * Returns `null` if LMP unknown; `-1` if the day is before LMP.
   */
  private getPregnancyWeekForCalendarDay(ref: Date): number | null {
    const u0 = this.getLmpUtcMidnightMs();
    if (u0 === null) {
      return null;
    }
    const u1 = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
    if (u1 < u0) {
      return -1;
    }
    const days = Math.floor((u1 - u0) / 86400000);
    return Math.min(42, Math.max(1, Math.floor(days / 7) + 1));
  }

  private computePregnancyWeekForDate(ref: Date): number {
    const w = this.getPregnancyWeekForCalendarDay(ref);
    if (w === null || w < 1) {
      return this.pregnancyWeek;
    }
    return w;
  }

  private getPregnancyMonday(d: Date): Date {
    const x = new Date(d);
    const dow = x.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    x.setDate(x.getDate() + mondayOffset);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  /** Calendar-day index (UTC midnight) for local Y/M/D — stable across DST vs raw ms / week. */
  private pregnancyCalendarUtcDayIndex(d: Date): number {
    return Math.floor(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000
    );
  }

  /** Whole weeks between two local-calendar Mondays (aligned with `getPregnancyCalendarWeeks`). */
  private diffPregnancyCalendarWeeksBetweenMondays(
    fromMonday: Date,
    toMonday: Date
  ): number {
    const deltaDays =
      this.pregnancyCalendarUtcDayIndex(toMonday) -
      this.pregnancyCalendarUtcDayIndex(fromMonday);
    return deltaDays / 7;
  }

  /** Today’s date for the strip above the week picker (locale-aware). */
  getPregnancyTodayHeaderDate(): string {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Horizontally scrollable weeks (Mon–Sun). Each “slide” is one week; user can tap a day
   * (today or earlier) to update the hero.
   */
  getPregnancyCalendarWeeks(): {
    weekKey: string;
    days: {
      label: string;
      dateNum: number;
      isToday: boolean;
      isoKey: string;
      fullDate: Date;
    }[];
  }[] {
    const today = new Date();
    const anchorMonday = this.getPregnancyMonday(today);
    const letter = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const weeks: {
      weekKey: string;
      days: {
        label: string;
        dateNum: number;
        isToday: boolean;
        isoKey: string;
        fullDate: Date;
      }[];
    }[] = [];

    for (
      let w = -this.pregnancyCalWeeksPast;
      w <= this.pregnancyCalWeeksFuture;
      w++
    ) {
      const monday = new Date(anchorMonday);
      monday.setDate(anchorMonday.getDate() + w * 7);
      const days: {
        label: string;
        dateNum: number;
        isToday: boolean;
        isoKey: string;
        fullDate: Date;
      }[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const isToday =
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear();
        const isoKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        days.push({
          label: isToday ? 'TODAY' : letter[i],
          dateNum: d.getDate(),
          isToday,
          isoKey,
          fullDate: d,
        });
      }

      weeks.push({
        weekKey: `${monday.getFullYear()}-${
          monday.getMonth() + 1
        }-${monday.getDate()}`,
        days,
      });
    }

    return weeks;
  }

  isPregnancyCalendarFutureDay(d: { fullDate: Date }): boolean {
    const today = new Date();
    const u0 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const u1 = Date.UTC(
      d.fullDate.getFullYear(),
      d.fullDate.getMonth(),
      d.fullDate.getDate()
    );
    return u1 > u0;
  }

  /** Future days, before LMP/conception start, or outside week 4–40. */
  isPregnancyCalendarDayDisabled(d: { fullDate: Date }): boolean {
    if (this.isPregnancyCalendarFutureDay(d)) {
      return true;
    }
    const w = this.getPregnancyWeekForCalendarDay(d.fullDate);
    if (w === null) {
      return false;
    }
    return (
      w < this.pregnancyCalendarMinWeek || w > this.pregnancyCalendarMaxWeek
    );
  }

  isPregnancyCalendarDaySelected(d: {
    isToday: boolean;
    isoKey: string;
  }): boolean {
    if (this.pregnancyCalendarSelectedIsoKey) {
      return d.isoKey === this.pregnancyCalendarSelectedIsoKey;
    }
    return d.isToday;
  }

  onPregnancyCalendarPickDay(d: {
    isToday: boolean;
    isoKey: string;
    fullDate: Date;
  }): void {
    if (this.isPregnancyCalendarDayDisabled(d)) {
      return;
    }
    if (d.isToday) {
      this.pregnancyCalendarViewDate = null;
      this.pregnancyCalendarSelectedIsoKey = null;
    } else {
      this.pregnancyCalendarSelectedIsoKey = d.isoKey;
      this.pregnancyCalendarViewDate = new Date(
        d.fullDate.getFullYear(),
        d.fullDate.getMonth(),
        d.fullDate.getDate()
      );
    }
    this.cdr.markForCheck();
    this.schedulePregnancyConnectorUpdate();
  }

  onPregnancyCalendarScrollForConnector(): void {
    if (this.pregnancyConnectorScrollTimer != null) {
      clearTimeout(this.pregnancyConnectorScrollTimer);
    }
    this.pregnancyConnectorScrollTimer = setTimeout(() => {
      this.pregnancyConnectorScrollTimer = null;
      this.schedulePregnancyConnectorUpdate();
    }, 48);
  }

  @HostListener('window:resize')
  onWindowResizeForPregnancyConnector(): void {
    this.schedulePregnancyConnectorUpdate();
  }

  schedulePregnancyConnectorUpdate(): void {
    if (!this.isPregnant() || this.needsPregnancyInput) {
      this.pregnancyConnector = null;
      this.pregnancyConnectorRafGen++;
      this.cdr.markForCheck();
      return;
    }
    const gen = ++this.pregnancyConnectorRafGen;
    requestAnimationFrame(() => {
      if (gen !== this.pregnancyConnectorRafGen) {
        return;
      }
      this.measurePregnancyConnector();
      this.cdr.markForCheck();
    });
  }

  private measurePregnancyConnector(): void {
    const wrap = this.pregnancyConnectWrapper?.nativeElement;
    if (!wrap || wrap.clientWidth < 8 || wrap.clientHeight < 8) {
      this.pregnancyConnector = null;
      return;
    }
    const selected = wrap.querySelector<HTMLElement>(
      '.pregnancy-calendar-col--selected:not(:disabled)'
    );
    const disk = wrap.querySelector<HTMLElement>('.pregnancy-hero-disk');
    if (!selected || !disk) {
      this.pregnancyConnector = null;
      return;
    }
    const wr = wrap.getBoundingClientRect();
    const sr = selected.getBoundingClientRect();
    const hr = disk.getBoundingClientRect();
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    // Start on the pregnancy hero disk (top center — the circular “shape”).
    const x1 = hr.left + hr.width / 2 - wr.left;
    const y1 = hr.top - wr.top + 12;
    // End at the full selected day column (not the inner date numeral).
    const x2 = sr.left + sr.width / 2 - wr.left;
    const y2 = sr.bottom - wr.top - 2;
    if (y1 <= y2 + 8) {
      this.pregnancyConnector = null;
      return;
    }
    if (Math.abs(x2 - x1) > w * 0.62) {
      this.pregnancyConnector = null;
      return;
    }
    const cx = (x1 + x2) / 2;
    const sag = Math.min(14, Math.max(3, Math.abs(x2 - x1) * 0.12));
    const cy = (y1 + y2) / 2 + sag;
    const pathD = `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${cx.toFixed(
      2
    )} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    this.pregnancyConnector = { w, h, pathD };
  }

  scheduleScrollPregnancyCalendarToAnchor(): void {
    if (!this.isPregnant) {
      return;
    }
    setTimeout(() => this.scrollPregnancyCalendarToAnchor(), 0);
  }

  private scrollPregnancyCalendarToAnchor(): void {
    const host = this.pregnancyCalendarScroll?.nativeElement;
    if (!host || host.clientWidth < 1) {
      return;
    }
    const ref = this.pregnancyCalendarViewDate ?? new Date();
    const anchorMonday = this.getPregnancyMonday(new Date());
    const refMonday = this.getPregnancyMonday(ref);
    const diffWeeks = this.diffPregnancyCalendarWeeksBetweenMondays(
      anchorMonday,
      refMonday
    );
    const idx = Math.max(
      0,
      Math.min(
        this.pregnancyCalWeeksPast + this.pregnancyCalWeeksFuture,
        this.pregnancyCalWeeksPast + diffWeeks
      )
    );
    const weekEl = host.children[idx] as HTMLElement | undefined;
    if (weekEl) {
      const prevBehavior = host.style.scrollBehavior;
      host.style.scrollBehavior = 'auto';
      host.scrollLeft = weekEl.offsetLeft;
      host.style.scrollBehavior = prevBehavior;
    } else {
      host.scrollLeft = idx * host.clientWidth;
    }
    this.schedulePregnancyConnectorUpdate();
  }

  /** 1-based day count since LMP (first day of pregnancy = 1). */
  getTotalPregnancyDaysAlong(): number {
    const ref = this.pregnancyCalendarViewDate ?? new Date();
    const d = this.getCalendarDaysSinceLmp(ref);
    if (d === null) {
      const w = this.pregnancyWeek;
      const day = this.pregnancyDayInWeek;
      if (w < 1) {
        return 1;
      }
      return Math.max(1, (w - 1) * 7 + day + 1);
    }
    return d + 1;
  }

  getTrimesterInsightLabel(): string {
    const clinical = Math.max(1, this.getPregnancyDisplayWeek());
    if (clinical <= 13) return this.tr('home.trimester.first');
    if (clinical <= 27) return this.tr('home.trimester.second');
    return this.tr('home.trimester.third');
  }

  openPregnancyWatchouts(): void {
    this.router.navigate(['/tabs/insights']);
  }

  /** Horizontal “My daily insights” cards (excluding the stacked summary card). */
  getPregnancyDailyInsightStripTopics(): DailyInsightTopic[] {
    const w = Math.max(1, Math.min(40, this.getPregnancyDisplayWeek()));
    const daysAlong = this.getTotalPregnancyDaysAlong();
    const phase = this.getPregnancyPhaseOrInsightLine();
    const trimester = this.getTrimesterInsightLabel();
    const name = this.getCycleWelcomeName();
    const routeWeek = this.getPregnancyWeekDetailRouteParam();
    const devFact = getBabyDevelopmentFactForWeek(routeWeek);
    const funFact = getBabyFunFactForWeek(routeWeek);
    const tipA = this.dashboardPregnancyTips[0]?.trim();
    const tipB = this.dashboardPregnancyTips[1]?.trim();

    const hydrationBody =
      tipA && /\b(hydrat|water|fluid|drink)\b/i.test(tipA)
        ? tipA
        : this.tr('home.pregInsight.hydrationDefault');

    const restBody =
      tipB && /\b(rest|sleep|tired|fatigue)\b/i.test(tipB)
        ? tipB
        : this.tr('home.pregInsight.restDefault');

    const topics: DailyInsightTopic[] = [
      this.buildSymptomLogInsightTopic('pregnancy'),
      {
        id: 'hydration',
        categoryLabel: this.tr('home.strip.categoryHydration'),
        teaser: this.tr('home.pregStrip.hydrationTeaser'),
        accentHex: '#0284c7',
        ionIcon: 'water-outline',
        slides: [
          {
            title: this.tr('home.pregInsight.hydrationTitle'),
            body: hydrationBody,
          },
          {
            title: this.tr('home.strip.tryThisToday'),
            body: this.tr('home.pregInsight.hydrationTryBody'),
          },
        ],
      },
      {
        id: 'rest',
        categoryLabel: this.tr('home.strip.categoryRest'),
        teaser: this.tr('home.pregStrip.restTeaser'),
        accentHex: '#9333ea',
        ionIcon: 'moon-outline',
        slides: [
          {
            title: this.tr('home.strip.restCountsTitle'),
            body: restBody,
          },
          {
            title: this.tr('home.pregInsight.restWindTitle'),
            body: this.tr('home.pregInsight.restWindBody'),
          },
        ],
      },
      {
        id: 'baby',
        categoryLabel: this.tr('home.strip.categoryBaby'),
        teaser: this.tr('home.pregStrip.babyTeaser', {
          week: w,
          size: this.babySize,
        }),
        accentHex: '#0d9488',
        ionIcon: 'medical',
        slides: [
          {
            title: this.tr('home.pregInsight.babySlide1Title', { week: w }),
            body: devFact,
          },
          {
            title: this.tr('home.pregInsight.babySlide2Title'),
            body: funFact,
          },
          {
            title: this.tr('home.pregInsight.babySlide3Title'),
            body: this.tr('home.pregInsight.babySlide3Body'),
          },
        ],
      },
      {
        id: 'for-you',
        categoryLabel: this.tr('home.strip.categoryForYou'),
        teaser: this.tr('home.pregStrip.forYouTeaser', { name }),
        accentHex: '#db2777',
        ionIcon: 'heart-outline',
        personalized: true,
        slides: [
          {
            title: this.tr('home.pregInsight.forYouSlide1Title', { name }),
            body: this.tr('home.pregInsight.forYouSlide1Body', {
              days: daysAlong,
              trimester: trimester.toLowerCase(),
              phase,
            }),
          },
          {
            title: this.tr('home.pregInsight.forYouSlide2Title'),
            body: this.tr('home.pregInsight.forYouSlide2Body'),
          },
          {
            title: this.tr('home.pregInsight.forYouSlide3Title'),
            body: this.tr('home.pregInsight.forYouSlide3Body'),
          },
        ],
      },
    ];
    return topics;
  }

  getPregnancyDailyInsightSummaryTopic(): DailyInsightTopic {
    const w = Math.max(1, this.getPregnancyDisplayWeek());
    const daysAlong = this.getTotalPregnancyDaysAlong();
    const phase = this.getPregnancyPhaseOrInsightLine();
    const strip = this.getPregnancyDailyInsightStripTopics();
    const teaser =
      strip.length > 0
        ? this.tr('home.pregSummary.teaserMulti', { count: strip.length })
        : this.tr('home.pregSummary.teaserEmpty');

    const last = this.homeFacade.recentSymptomsDays()[0];
    let snapshotBody = this.tr('home.pregSummary.bodyBase', {
      days: daysAlong,
      week: w,
      phase,
    });
    if (last) {
      const dk = this.isoDateFromTrackRow(last.date);
      const { moodText, symptomNames } = this.describeSymptomLogRow(last);
      const when = dk
        ? this.formatDate(`${dk}T12:00:00`)
        : this.tr('home.common.recently');
      const tail = [moodText, ...symptomNames.slice(0, 3)]
        .filter(Boolean)
        .join(', ');
      snapshotBody += tail
        ? this.tr('home.pregSummary.symptomTail', { when, tail })
        : this.tr('home.pregSummary.symptomBare', { when });
    }

    return {
      id: 'today-summary',
      categoryLabel: this.tr('home.pregSummary.categoryToday'),
      teaser,
      accentHex: '#ec4899',
      ionIcon: 'happy-outline',
      slides: [
        {
          title: this.tr('home.pregSummary.slide1Title'),
          body: snapshotBody,
        },
        {
          title: this.tr('home.pregSummary.slide2Title'),
          body: this.tr('home.pregSummary.slide2Body'),
        },
      ],
    };
  }

  async openDailyInsightStory(topic: DailyInsightTopic): Promise<void> {
    try {
      const modal = await this.modalController.create({
        component: DailyInsightsStoryModalComponent,
        componentProps: { topic },
        cssClass: 'daily-insight-story-modal',
        backdropDismiss: true,
      });
      await modal.present();
    } catch {
      await this.showToast(this.tr('home.openInsightStoryError'), 'danger');
    }
  }

  /** Insights tab — same destination as pregnancy “Watch-outs”. */
  openCycleInsightsFromHome(): void {
    this.router.navigate(['/tabs/insights']);
  }

  /** Cycle home: phase + mood aware horizontal story strip. */
  getCycleDailyInsightStripTopics(): DailyInsightTopic[] {
    const fromApi = this.buildPhaseGuideStripTopics();
    if (fromApi.length >= 2) {
      return [
        this.buildSymptomLogInsightTopic('cycle'),
        ...this.orderCycleStripByMood(fromApi),
        this.buildCycleMoodPersonalizedTopic(),
      ];
    }
    return this.buildFallbackCycleStripTopics();
  }

  /** Icons on the stacked summary card — reflect mood + cycle phase. */
  getCycleSummaryStripIcons(): { mood: string; phase: string } {
    return {
      mood: this.moodStripMeta(this.getLatestMoodKey()).icon,
      phase: this.getCyclePhaseStripIcon(),
    };
  }

  /** Personalized wide-card teaser bound to latest logged mood. */
  getCyclePersonalizedStripTeaser(): string {
    const moodLabel = this.getLatestMoodLabel();
    if (!moodLabel) {
      return this.tr('home.personalizedCycleTeaser');
    }
    const group = this.moodStripMeta(this.getLatestMoodKey()).group;
    return this.tr(`home.cycleStrip.moodGroup.${group}.personalTeaser`, {
      mood: moodLabel,
    });
  }

  getCycleInsightsHeading(): string {
    const moodLabel = this.getLatestMoodLabel();
    if (moodLabel) {
      return this.tr('home.cycleInsights.headingWithMood', { mood: moodLabel });
    }
    return this.getCyclePhaseGuideHeadline();
  }

  private getLatestMoodKey(): string | null {
    const last = this.homeFacade.recentSymptomsDays()[0];
    if (!last) {
      return null;
    }
    const raw = last?.mood;
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim().replace(/\s+/g, '_').toLowerCase();
    }
    if (raw && typeof raw === 'object') {
      const id = String(raw['id'] ?? '').trim();
      if (id) {
        return id.replace(/\s+/g, '_').toLowerCase();
      }
    }
    return null;
  }

  private getLatestMoodLabel(): string {
    const last = this.homeFacade.recentSymptomsDays()[0];
    if (!last) {
      return '';
    }
    return this.describeSymptomLogRow(last).moodText.trim();
  }

  private moodStripMeta(moodKey: string | null): {
    icon: string;
    accent: string;
    group: 'upbeat' | 'low' | 'anxious' | 'irritable' | 'default';
  } {
    const k = (moodKey ?? '').toLowerCase();
    const low = [
      'low_energy',
      'tired',
      'apathetic',
      'depressed',
      'sad',
      'fatigue',
    ];
    const anxious = [
      'anxious',
      'mood_swings',
      'obsessive',
      'confused',
      'guilty',
      'self_critical',
    ];
    const upbeat = ['happy', 'energetic', 'frisky', 'calm'];
    if (low.includes(k)) {
      return { icon: 'moon-outline', accent: '#9333ea', group: 'low' };
    }
    if (anxious.includes(k)) {
      return { icon: 'heart-dislike-outline', accent: '#f97316', group: 'anxious' };
    }
    if (upbeat.includes(k)) {
      return { icon: 'happy-outline', accent: '#db2777', group: 'upbeat' };
    }
    if (k === 'irritated') {
      return { icon: 'flash-outline', accent: '#e11d48', group: 'irritable' };
    }
    return { icon: 'heart-outline', accent: '#db2777', group: 'default' };
  }

  private getCyclePhaseStripIcon(): string {
    const icons: Record<string, string> = {
      period: 'water-outline',
      follicular: 'walk-outline',
      fertile: 'heart-outline',
      luteal: 'moon-outline',
      none: 'calendar-outline',
    };
    return icons[this.getCyclePhaseTone()] ?? 'pulse-outline';
  }

  /** Map dashboard phase-guide cards into strip topics (localized copy, API layout). */
  private buildPhaseGuideStripTopics(): DailyInsightTopic[] {
    const cards = this.getCyclePhaseGuideCards();
    if (!cards.length) {
      return [];
    }
    return cards.slice(0, 3).map((card, index) => ({
      id: `cycle-pg-${card.id}`,
      categoryLabel: card.title,
      teaser: this.truncateInsightTeaser(card.body),
      accentHex: card.accentHex,
      ionIcon: card.ionIcon,
      slides: [
        { title: card.title, body: card.body },
        {
          title: this.tr('home.strip.tryThisToday'),
          body: card.body,
        },
      ],
    }));
  }

  private orderCycleStripByMood(
    topics: DailyInsightTopic[],
  ): DailyInsightTopic[] {
    const group = this.moodStripMeta(this.getLatestMoodKey()).group;
    if (group !== 'low' && group !== 'anxious') {
      return topics;
    }
    const restLike = topics.find((t) =>
      /rest|moon|comfort|calm|pms|mood/i.test(`${t.id} ${t.categoryLabel}`),
    );
    if (!restLike) {
      return topics;
    }
    return [restLike, ...topics.filter((t) => t.id !== restLike.id)];
  }

  private buildCycleMoodPersonalizedTopic(): DailyInsightTopic {
    const name = this.getCycleWelcomeName();
    const moodKey = this.getLatestMoodKey();
    const moodLabel = this.getLatestMoodLabel();
    const phase = this.getCyclePhaseTone();
    const phaseLabel = this.tr(`home.cyclePhase.${phase}`);
    const phaseAdvice = this.getCyclePhaseGuideSubtitle();
    const meta = this.moodStripMeta(moodKey);
    const day = this.getCycleDisplayDay();
    const len = Math.max(1, this.currentCycleLength || 28);
    const plen = Math.max(1, this.periodLength || 5);
    const describe = this.getCycleDayDescription();

    if (moodLabel) {
      const g = meta.group;
      return {
        id: 'cycle-mood-for-you',
        categoryLabel: this.tr(`home.cycleStrip.moodGroup.${g}.category`, {
          mood: moodLabel,
        }),
        teaser: this.tr(`home.cycleStrip.moodGroup.${g}.teaser`, {
          name,
          mood: moodLabel,
        }),
        accentHex: meta.accent,
        ionIcon: meta.icon,
        personalized: true,
        slides: [
          {
            title: this.tr(`home.cycleStrip.moodGroup.${g}.slide1Title`, {
              name,
              mood: moodLabel,
            }),
            body: this.tr(`home.cycleStrip.moodGroup.${g}.slide1Body`, {
              mood: moodLabel,
              phase: phaseLabel,
              advice: phaseAdvice,
              day,
              len,
            }),
          },
          {
            title: this.tr(`home.cycleStrip.moodGroup.${g}.slide2Title`),
            body: this.tr(`home.cycleStrip.moodGroup.${g}.slide2Body`, {
              mood: moodLabel,
              describe,
            }),
          },
          {
            title: this.tr('home.cycleStrip.forYouSlide3Title'),
            body: this.tr('home.cycleStrip.forYouSlide3Body'),
          },
        ],
      };
    }

    return {
      id: 'cycle-for-you',
      categoryLabel: this.tr('home.strip.categoryForYou'),
      teaser: this.tr('home.cycleStrip.forYouTeaser', { name }),
      accentHex: '#db2777',
      ionIcon: 'heart-outline',
      personalized: true,
      slides: [
        {
          title: this.tr('home.cycleStrip.forYouSlide1Title', { name }),
          body: this.tr('home.cycleStrip.forYouSlide1Body', {
            day,
            len,
            plen,
            p: plen === 1 ? '' : 's',
            describe,
          }),
        },
        {
          title: this.tr('home.cycleStrip.forYouSlide2Title'),
          body: phaseAdvice || this.tr('home.cycleStrip.forYouSlide2Body'),
        },
        {
          title: this.tr('home.cycleStrip.forYouSlide3Title'),
          body: this.tr('home.cycleStrip.forYouSlide3Body'),
        },
      ],
    };
  }

  private buildFallbackCycleStripTopics(): DailyInsightTopic[] {
    const phase = this.getCyclePhaseTone();
    const day = this.getCycleDisplayDay();
    const len = Math.max(1, this.currentCycleLength || 28);
    const plen = Math.max(1, this.periodLength || 5);
    const nextPeriodDays = this.getNextPeriodInDays();
    const status = this.getCycleDayStatus();
    const describe = this.getCycleDayDescription();
    const ovulationDay = Math.max(1, len - 14);
    const tipA = this.dashboardCycleTips[0]?.trim();
    const tipB = this.dashboardCycleTips[1]?.trim();

    const hydrationBody = tipA || this.tr('home.cycleStrip.hydrationBody');

    const restBody = tipB || this.tr('home.cycleStrip.restBody');

    const topics: DailyInsightTopic[] = [
      this.buildSymptomLogInsightTopic('cycle'),
      {
        id: `cycle-hydration-${phase}`,
        categoryLabel: this.tr('home.strip.categoryHydration'),
        teaser:
          this.trOrNull(`home.cycleStrip.${phase}.hydrationTeaser`) ||
          this.tr('home.cycleStrip.hydrationTeaser'),
        accentHex: '#0284c7',
        ionIcon: 'water-outline',
        slides: [
          {
            title:
              this.trOrNull(`home.cycleStrip.${phase}.hydrationSlide1Title`) ||
              this.tr('home.cycleStrip.hydrationSlide1Title'),
            body: hydrationBody,
          },
          {
            title: this.tr('home.strip.tryThisToday'),
            body: this.tr('home.cycleStrip.hydrationSlide2Body'),
          },
        ],
      },
      {
        id: `cycle-rest-${phase}`,
        categoryLabel: this.tr('home.strip.categoryRest'),
        teaser:
          this.trOrNull(`home.cycleStrip.${phase}.restTeaser`) ||
          this.tr('home.cycleStrip.restTeaser'),
        accentHex: '#9333ea',
        ionIcon: 'moon-outline',
        slides: [
          {
            title:
              this.trOrNull(`home.cycleStrip.${phase}.restSlide1Title`) ||
              this.tr('home.cycleStrip.restSlide1Title'),
            body: restBody,
          },
          {
            title: this.tr('home.pregInsight.restWindTitle'),
            body: this.tr('home.cycleStrip.restSlide2Body'),
          },
        ],
      },
      {
        id: 'cycle-body',
        categoryLabel: this.tr('home.cycleStrip.categoryYourCycle'),
        teaser: this.tr('home.cycleStrip.bodyTeaser', { day, len }),
        accentHex: '#0d9488',
        ionIcon: 'pulse-outline',
        slides: [
          {
            title: this.tr('home.cycleStrip.bodySlide1Title', { day, len }),
            body: `${status}: ${describe}`,
          },
          {
            title: this.tr('home.cycleStrip.bodySlide2Title'),
            body: this.tr('home.cycleStrip.bodySlide2Body', {
              next: nextPeriodDays,
              plural: nextPeriodDays === 1 ? '' : 's',
              ovu: ovulationDay,
              len,
            }),
          },
          {
            title: this.tr('home.cycleStrip.bodySlide3Title'),
            body: this.tr('home.cycleStrip.bodySlide3Body'),
          },
        ],
      },
      this.buildCycleMoodPersonalizedTopic(),
    ];
    return [
      topics[0],
      ...this.orderCycleStripByMood(topics.slice(1, -1)),
      topics[topics.length - 1],
    ];
  }

  getCycleDailyInsightSummaryTopic(): DailyInsightTopic {
    const day = this.getCycleDisplayDay();
    const len = Math.max(1, this.currentCycleLength || 28);
    const strip = this.getCycleDailyInsightStripTopics();
    const teaser =
      strip.length > 0
        ? this.tr('home.cycleSummary.teaserMulti', { count: strip.length })
        : this.tr('home.cycleSummary.teaserEmpty');

    const last = this.homeFacade.recentSymptomsDays()[0];
    let snapshotBody =
      this.dashboardCycleInsight?.trim() ||
      this.tr('home.cycleSummary.bodyBase', {
        day,
        len,
        status: this.getCycleDayStatus(),
      });
    if (last) {
      const dk = this.isoDateFromTrackRow(last.date);
      const { moodText, symptomNames } = this.describeSymptomLogRow(last);
      const when = dk
        ? this.formatDate(`${dk}T12:00:00`)
        : this.tr('home.common.recently');
      const tail = [moodText, ...symptomNames.slice(0, 3)]
        .filter(Boolean)
        .join(', ');
      snapshotBody += tail
        ? this.tr('home.pregSummary.symptomTail', { when, tail })
        : this.tr('home.pregSummary.symptomBare', { when });
    }

    return {
      id: 'cycle-today-summary',
      categoryLabel: this.tr('home.cycleSummary.categoryToday'),
      teaser,
      accentHex: '#ec4899',
      ionIcon: 'happy-outline',
      slides: [
        {
          title: this.tr('home.cycleSummary.slide1Title'),
          body: snapshotBody,
        },
        {
          title: this.tr('home.cycleSummary.slide2Title'),
          body: this.tr('home.cycleSummary.slide2Body'),
        },
      ],
    };
  }

  getPostDueHintText(): string {
    return this.tr('home.postDueHint', {
      week: this.getPregnancyDisplayWeek(),
    });
  }

  getWeekDetailChipLabel(): string {
    return this.tr('home.weekDetailChip', {
      week: this.getPregnancyDisplayWeek(),
    });
  }

  getWeekDetailActionTitle(): string {
    return this.tr('home.weekDetailActionTitle', {
      week: this.getPregnancyDisplayWeek(),
    });
  }

  getPregnancyInsightsHeading(): string {
    if (!this.pregnancyCalendarViewDate) {
      return this.tr('home.dailyInsights.headingToday');
    }
    return `${this.tr(
      'home.dailyInsights.headingPrefix'
    )}${this.pregnancyCalendarViewDate.toLocaleDateString(
      this.dateLocaleTag(),
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }
    )}`;
  }

  /**
   * First “daily insight” card: phase / API line. When browsing the week calendar, always
   * derive from the displayed gestational week so it matches the picked day.
   */
  getPregnancyPhaseOrInsightLine(): string {
    const displayWeek = Math.max(1, this.getPregnancyDisplayWeek());
    if (this.pregnancyCalendarViewDate) {
      return pregnancyDashboardInsightFromWeek(displayWeek);
    }
    const fromApi = this.dashboardPregnancyInsight?.trim();
    if (fromApi) {
      return fromApi;
    }
    const tip = this.dashboardPregnancyTips[0]?.trim();
    if (tip) {
      return tip;
    }
    return pregnancyDashboardInsightFromWeek(displayWeek);
  }

  getPregnancyBabyEmoji(): string {
    if (this.getPregnancyDisplayWeek() > 40) {
      return '✨';
    }
    return this.getBabyEmoji(this.getPregnancyWeekDetailRouteParam());
  }

  /** Week-based hero image inside the circle, or `null` to use emoji. */
  getPregnancyHeroIllustrationUrl(): string | null {
    if (!this.isPregnant() || this.needsPregnancyInput) {
      return null;
    }
    return pregnancyWeekIllustrationUrl(this.getPregnancyDisplayWeek());
  }

  getPregnancyHeroIllustrationAlt(): string {
    return pregnancyWeekIllustrationAlt(this.getPregnancyDisplayWeek());
  }

  openStatusDetails(): void {
    if (this.isPregnant()) {
      this.router.navigate(['/week-detail'], {
        queryParams: { week: this.getPregnancyWeekDetailRouteParam() },
      });
    } else if (this.isHomeCycleTrackingLayout()) {
      this.openSymptomsTracking();
    } else {
      this.router.navigate(['/profile']);
    }
  }

  getProgressCircumference(): string {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    return `${circumference} ${circumference}`;
  }

  getProgressOffset(): string {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(100, this.pregnancyProgress || 0));
    const offset = circumference - (progress / 100) * circumference;
    return `${offset}`;
  }

  getDaysRemaining(): number {
    const total = this.getTotalPregnancyDaysAlong();
    return Math.max(0, 280 - (total - 1));
  }

  getDueDate(): string {
    if (!this.pregnancyStartDate) {
      return this.tr('home.pregSlider.dueDateNotSet');
    }
    const raw = this.pregnancyStartDate.includes('T')
      ? this.pregnancyStartDate
      : `${this.pregnancyStartDate}T12:00:00`;
    const dueDate = new Date(raw);
    dueDate.setDate(dueDate.getDate() + 280);
    return dueDate.toLocaleDateString(this.dateLocaleTag(), {
      month: 'short',
      day: 'numeric',
    });
  }

  /** Localized school week copy (`school.dev.w12`, etc.) with English/service fallback. */
  private schoolWeekText(
    prefix: 'school.dev' | 'school.fun' | 'school.size' | 'school.sizeDesc',
    week: number,
  ): string {
    const w = Math.max(4, Math.min(40, Math.round(week)));
    const key = `${prefix}.w${w}`;
    const translated = this.tr(key);
    if (translated !== key) {
      return translated;
    }
    const baby = this.getCurrentBabySize();
    if (prefix === 'school.size') {
      return baby.size;
    }
    if (prefix === 'school.sizeDesc') {
      return baby.description;
    }
    return this.tr(`${prefix}.default`);
  }

  /** Swipeable pregnancy highlights — baby size, facts, and journey stats. */
  getPregnancyFeatureSlides(): PregnancyFeatureSlide[] {
    const week = Math.max(1, Math.min(42, this.getPregnancyDisplayWeek()));
    const routeWeek = this.getPregnancyWeekDetailRouteParam();
    const baby = this.getCurrentBabySize();
    const trimester = this.getTrimesterInsightLabel();
    const daysRemaining = this.getDaysRemaining();
    const progress = this.getProgressPercentage();
    const dueLabel = this.getDueDate();

    const slides: PregnancyFeatureSlide[] = [
      {
        id: 'baby-size',
        variant: 'rose',
        eyebrowKey: 'home.pregSlider.babyEyebrow',
        eyebrowParams: { week },
        headline: this.schoolWeekText('school.size', routeWeek),
        body: this.schoolWeekText('school.sizeDesc', routeWeek),
        footnoteKey: 'home.pregSlider.babyWeight',
        footnoteParams: { weight: baby.weight },
        ionIcon: 'nutrition-outline',
        imageUrl: this.getPregnancyHeroIllustrationUrl(),
      },
      {
        id: 'fun-fact',
        variant: 'violet',
        eyebrowKey: 'home.didYouKnow',
        headline: this.tr('home.pregSlider.funFactHeadline'),
        body: this.schoolWeekText('school.fun', routeWeek),
        ionIcon: 'sparkles-outline',
      },
      {
        id: 'development',
        variant: 'teal',
        eyebrowKey: 'home.pregSlider.developEyebrow',
        headline: this.tr('home.pregSlider.developHeadline', { week }),
        body: this.schoolWeekText('school.dev', routeWeek),
        ionIcon: 'pulse-outline',
      },
    ];

    if (this.isPregnancyPostDueWindow()) {
      slides.push({
        id: 'countdown',
        variant: 'amber',
        eyebrowKey: 'home.pregSlider.postDueEyebrow',
        headline: this.tr('home.pregSlider.postDueHeadline'),
        body: this.tr('home.pregSlider.postDueBody'),
        footnoteKey: 'home.pregSlider.postDueFootnote',
        footnoteParams: { week },
        ionIcon: 'heart-outline',
      });
    } else {
      slides.push({
        id: 'countdown',
        variant: 'amber',
        eyebrowKey: 'home.pregSlider.journeyEyebrow',
        eyebrowParams: { trimester },
        headline: this.tr('home.pregSlider.daysToGo', {
          days: daysRemaining,
        }),
        body: this.tr('home.pregSlider.dueDate', { date: dueLabel }),
        footnoteKey: 'home.pregSlider.progress',
        footnoteParams: { percent: progress },
        ionIcon: 'calendar-outline',
      });
    }

    return slides;
  }

  onPregnancyFeatureSlideClick(slide: PregnancyFeatureSlide): void {
    if (slide.id === 'fun-fact') {
      const babyTopic = this.getPregnancyDailyInsightStripTopics().find(
        (t) => t.id === 'baby',
      );
      if (babyTopic) {
        void this.openDailyInsightStory(babyTopic);
        return;
      }
    }
    this.openCurrentPregnancyWeekDetail();
  }

  pregSlideText(
    key: string,
    params?: Record<string, string | number>,
  ): string {
    return this.tr(key, params);
  }

  pregSlideAriaLabel(slide: PregnancyFeatureSlide): string {
    const eyebrow = slide.eyebrowParams
      ? this.tr(slide.eyebrowKey, slide.eyebrowParams)
      : this.tr(slide.eyebrowKey);
    return `${eyebrow}. ${slide.headline}`;
  }

  getTrimester(): string {
    const clinical = Math.max(1, this.pregnancyWeek);
    if (clinical <= 13) return '1st Trimester';
    if (clinical <= 27) return '2nd Trimester';
    return '3rd Trimester';
  }

  getMilestone(): string {
    const clinical = Math.max(1, this.pregnancyWeek);
    if (clinical <= 4) return 'Early Development';
    if (clinical <= 8) return 'Organ Formation';
    if (clinical <= 12) return 'First Trimester Complete';
    if (clinical <= 20) return 'Halfway There!';
    if (clinical <= 28) return 'Third Trimester';
    if (clinical <= 36) return 'Almost Ready';
    return 'Full Term';
  }

  getProgressPercentage(): number {
    return Math.round(Math.max(0, Math.min(100, this.pregnancyProgress || 0)));
  }

  viewExpertProfile(): void {
    this.router.navigate(['/tabs/consultation']);
  }

  // UI State Properties
  hasUserAvatar = false;
  hasExpertImage = false;
}
