import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  ElementRef,
  HostListener,
  inject,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  AlertController,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  addCircleOutline,
  airplaneOutline,
  alertCircleOutline,
  analytics,
  analyticsOutline,
  bedOutline,
  bulbOutline,
  calendar,
  calendarNumber,
  calendarNumberOutline,
  calendarOutline,
  calculatorOutline,
  checkmark,
  checkmarkCircle,
  chevronDownOutline,
  chevronForward,
  chevronUpOutline,
  closeCircleOutline,
  ellipseOutline,
  fitnessOutline,
  flameOutline,
  flower,
  flashOutline,
  handLeftOutline,
  happy,
  happyOutline,
  heart,
  heartDislikeOutline,
  heartOutline,
  homeOutline,
  lockClosedOutline,
  lockOpenOutline,
  medkitOutline,
  medical,
  medicalOutline,
  moonOutline,
  nutritionOutline,
  peopleCircleOutline,
  peopleOutline,
  personCircle,
  playCircleOutline,
  pulseOutline,
  refreshOutline,
  removeCircleOutline,
  resize,
  restaurantOutline,
  sad,
  sadOutline,
  scale,
  shareOutline,
  shieldOutline,
  star,
  swapHorizontalOutline,
  trendingUp,
  trophy,
  warningOutline,
  waterOutline,
  batteryDeadOutline,
  helpCircleOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { PregnancySetupSheetComponent } from '../shared/components/pregnancy-setup-sheet/pregnancy-setup-sheet.component';
import { PeriodDatePickerPageComponent } from '../period-date-picker-page/period-date-picker-page.component';
import { PeriodDateRange } from '../shared/components/period-date-picker/period-date-picker.component';
import { CirclePeriodChart } from '../shared/components/circle-period-chart/circle-period-chart';
import {
  FertilityResults,
  FertilityResultsModalComponent,
} from '../shared/components/fertility-results-modal/fertility-results-modal.component';
import {
  PregnancyResults,
  PregnancyResultsModalComponent,
} from '../shared/components/pregnancy-results-modal/pregnancy-results-modal.component';
import { SymptomsDto } from '../shared/models/symptoms.dto';
import {
  BabyDevelopmentService,
  BabySizeData,
} from '../shared/services/baby-development.service';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { PeriodHistoryService } from '../shared/services/period-history.service';
import { MessageService } from '../shared/services/message.service';
import { TrackDataService } from '../shared/services/track-data.service';
import { UserInfoService } from '../shared/services/user-info.service';
import { AuthService } from '../auth/services/auth';
import type { UserInfo } from '../shared/interfaces/user-info-api.interface';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import {
  OnboardingService,
  type InitializeReproductiveStateDto,
} from '../shared/services/onboarding.service';
import {
  HomeReproductiveUiService,
  type HomePageJourneyState,
} from './services/home-reproductive-ui.service';
import { HomeJourneyBridgeService } from './services/home-journey-bridge.service';
import { HomeDataService } from './services/home-data.service';
import { GrowthService } from '../shared/services/growth.service';
import {
  getBabyDevelopmentFactForWeek,
  getBabyFunFactForWeek,
} from './data/home-baby-week-copy';
import {
  gestationalWeekFromLmp,
  isoDateOnly,
  normalizeLmpInput,
} from '../shared/utils/pregnancy-lmp.util';
import { pregnancyDashboardInsightFromWeek } from '../shared/utils/pregnancy-dashboard-insight.util';
import { HOME_POSTPARTUM_WEEK_SAMPLES } from './data/home-postpartum-sample.data';
import { FirstWeekPlanService } from '../shared/services/first-week-plan.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', './home-pregnancy.styles.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, CirclePeriodChart],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class HomeComponent implements OnInit, ViewWillEnter {
  private cycleSettings = inject(CycleSettingsService);
  private babyDevelopmentService = inject(BabyDevelopmentService);
  private userInfoService = inject(UserInfoService);
  private authService = inject(AuthService);
  private onboardingService = inject(OnboardingService);
  private homeReproUi = inject(HomeReproductiveUiService);
  private homeJourneyBridge = inject(HomeJourneyBridgeService);
  private homeData = inject(HomeDataService);
  private firstWeekPlan = inject(FirstWeekPlanService);
  private growthService = inject(GrowthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private trackDataService = inject(TrackDataService);
  private periodHistory = inject(PeriodHistoryService);
  @ViewChild(CirclePeriodChart) periodChart!: CirclePeriodChart;
  @ViewChild('pregnancyCalendarScroll', { read: ElementRef })
  pregnancyCalendarScroll?: ElementRef<HTMLElement>;
  @ViewChild('pregnancyConnectWrapper', { read: ElementRef })
  pregnancyConnectWrapper?: ElementRef<HTMLElement>;

  /**
   * SVG overlay: tiny curved stroke from selected day circle → hero disk (wrapper-local px).
   */
  pregnancyConnector: {
    w: number;
    h: number;
    pathD: string;
  } | null = null;

  /** Unique fragment id for SVG marker-end (per component instance). */
  readonly pregnancyConnectorMarkerId = `ph-arr-${Math.random().toString(36).slice(2, 11)}`;

  private pregnancyConnectorRafGen = 0;
  private pregnancyConnectorScrollTimer: ReturnType<typeof setTimeout> | null = null;

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
  isPregnant: boolean = false; // Set to false by default
  isPostpartum: boolean = false;

  // Cycle tracking
  currentCycleDay: number = 0;
  currentCycleLength: number = 28;
  periodStartDate: Date | null = null;
  periodLength: number = 5;
  pregnancyWeek: number = 0;
  pregnancyProgress: number = 0;
  /** 0–6 (day within current pregnancy week), from dashboard. */
  pregnancyDayInWeek = 0;
  needsPregnancyInput = false;
  dashboardPregnancyTips: string[] = [];
  /** From dashboard `insight` when pregnant; may be filled locally if API omits it. */
  dashboardPregnancyInsight: string | null = null;
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
  showMoreSections: boolean = false;

  /** Daily check-in + growth points (server-backed). */
  growthStrip: {
    visible: boolean;
    streak: number;
    points: number;
    checkedInToday: boolean;
  } = { visible: false, streak: 0, points: 0, checkedInToday: false };

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
    private messageService: MessageService,
  ) {
    addIcons({
      add,
      addCircleOutline,
      airplaneOutline,
      alertCircleOutline,
      analytics,
      analyticsOutline,
      bedOutline,
      bulbOutline,
      calendar,
      calendarNumber,
      calendarNumberOutline,
      calendarOutline,
      calculatorOutline,
      checkmark,
      checkmarkCircle,
      chevronDownOutline,
      chevronForward,
      chevronUpOutline,
      closeCircleOutline,
      ellipseOutline,
      fitnessOutline,
      flameOutline,
      flower,
      flashOutline,
      handLeftOutline,
      happy,
      happyOutline,
      heart,
      heartDislikeOutline,
      heartOutline,
      homeOutline,
      lockClosedOutline,
      lockOpenOutline,
      medkitOutline,
      medical,
      medicalOutline,
      moonOutline,
      nutritionOutline,
      peopleCircleOutline,
      peopleOutline,
      personCircle,
      playCircleOutline,
      pulseOutline,
      refreshOutline,
      removeCircleOutline,
      resize,
      restaurantOutline,
      sad,
      sadOutline,
      scale,
      shareOutline,
      shieldOutline,
      star,
      swapHorizontalOutline,
      trendingUp,
      trophy,
      warningOutline,
      waterOutline,
      batteryDeadOutline,
      helpCircleOutline,
      informationCircleOutline,
    });

    // Reacts when week-detail pushes savedJourneyFromWeekDetail (signal) — works when ionViewWillEnter does not run.
    effect(() => {
      if (!this.authService.getAccessToken()) {
        return;
      }
      if (this.homeJourneyBridge.savedJourneyFromWeekDetail() === null) {
        return;
      }
      const state = this.homeJourneyBridge.consumeSavedJourneyFromWeekDetail();
      if (!state) {
        return;
      }
      this.applyJourneyStateToView(state);
      this.cdr.markForCheck();
      this.ngZone.run(() => this.runPeriodChartRefresh());
    });
  }

  ngOnInit() {
    this.generateMessages();
    if (!this.authService.getAccessToken()) {
      this.loadPersistedData();
      this.checkOnboardingStatus();
    } else {
      this.hydrateFromLocalOnboardingForAuthenticatedFallback();
    }
    this.firstWeekPlan.ensurePlanStarted();
    this.loadTodaySymptoms();
    this.loadRecentSymptomsDays();
    this.initializeHealthTip();
    // Embedded home tab may not always fire Ionic view enter before first paint.
    this.syncDashboardFromServerAndRefreshChart();

    // Listen for symptoms updates
    // window.addEventListener('symptomsUpdated', () => {
    //   this.loadTodaySymptoms();
    //   this.loadRecentSymptomsDays();
    // });
  }

  /**
   * Load persisted user status and period data from CycleSettingsService
   */
  private loadPersistedData() {
    // Load user status
    this.userStatus = this.cycleSettings.userStatus();
    this.isPregnant = this.cycleSettings.isPregnant();
    this.isPostpartum = this.cycleSettings.isPostpartum();

    // Load pregnancy data
    this.pregnancyWeek = this.cycleSettings.pregnancyWeek();
    this.pregnancyProgress = this.cycleSettings.pregnancyProgress();

    // Load period data
    const lastPeriodStart = this.cycleSettings.lastPeriodStartDate();
    if (lastPeriodStart) {
      this.periodStartDate = new Date(lastPeriodStart);
      this.updateCycleDay();
    }

    // Load cycle settings
    this.currentCycleLength = this.cycleSettings.cycleLength();
    this.periodLength = this.cycleSettings.periodLength();

    // Baby development data is automatically loaded by the service
    // and will be computed based on the current pregnancy week
  }

  /**
   * Signed-in fallback for users who selected dates in onboarding but have not fully
   * completed profile persistence yet. Prevents the "log last period" prompt flash
   * and backfills the journey row once.
   */
  private hydrateFromLocalOnboardingForAuthenticatedFallback(): void {
    const hasLmp = !!this.cycleSettings.lastPeriodStartDate();
    if (hasLmp) {
      return;
    }
    let data: {
      pregnancy_status?: string;
      lmp_date?: unknown;
      last_period?: unknown;
      cycle_length?: number;
      period_length?: number;
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

    const lmp = normalizeLmpInput(data.lmp_date ?? data.last_period);
    if (!lmp) {
      return;
    }

    const status = String(data.pregnancy_status ?? '').toLowerCase();
    const cycleLength = Number(data.cycle_length) || 28;
    const periodLength = Number(data.period_length) || 5;

    this.cycleSettings.setCycleLength(cycleLength);
    this.cycleSettings.setPeriodLength(periodLength);
    this.cycleSettings.setLastPeriodStart(lmp);
    this.periodStartDate = new Date(`${lmp}T12:00:00`);
    this.updateCycleDay();

    if (status === 'pregnant') {
      this.cycleSettings.setUserStatus('Pregnant');
      this.cycleSettings.setPregnancyStatus(true);
      this.cycleSettings.setPostpartumStatus(false);
      this.pregnancyStartDate = lmp;
      this.recomputePregnancyStatsFromLmpIfAvailable();
    } else if (status === 'postpartum') {
      this.cycleSettings.setUserStatus('Postpartum');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(true);
    } else {
      this.cycleSettings.setUserStatus('Trying to Conceive');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(false);
    }

    // One-time best-effort backfill to server journey row for signed-in users.
    const key = '__onboarding_lmp_backfilled__';
    if (sessionStorage.getItem(key) === '1') {
      return;
    }
    this.userInfoService
      .patchMeOnboarding({
        pregnancyStatus:
          status === 'pregnant'
            ? 'PREGNANT'
            : status === 'postpartum'
              ? 'POSTPARTUM'
              : 'PLANNING_PREGNANCY',
        lastPeriodDate: lmp,
        cycleLength,
        periodLength,
      })
      .subscribe({
        next: () => sessionStorage.setItem(key, '1'),
        error: () => {
          // non-fatal; dashboard sync will still run
        },
      });
  }

  /**
   * Check if user has completed onboarding and set appropriate status
   */
  private checkOnboardingStatus() {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    const onboardingData = localStorage.getItem('onboarding_data');

    if (onboardingCompleted === 'true' && onboardingData) {
      try {
        const data = JSON.parse(onboardingData);

        // Update user status based on onboarding data
        if (data.pregnancy_status === 'pregnant') {
          this.userStatus = 'Pregnant';
          this.isPregnant = true;
          this.isPostpartum = false;

          const lmpFromStore = normalizeLmpInput(data.lmp_date ?? data.last_period);
          if (lmpFromStore) {
            const w = gestationalWeekFromLmp(lmpFromStore);
            this.pregnancyWeek = w;
            this.pregnancyProgress = Math.min(100, Math.round((w / 40) * 100));
            this.cycleSettings.setPregnancyWeek(w);
            this.cycleSettings.setPregnancyProgress(this.pregnancyProgress);
          }

          // Update cycle settings
          this.cycleSettings.setUserStatus('Pregnant');
          this.cycleSettings.setPregnancyStatus(true);
          this.cycleSettings.setPostpartumStatus(false);
        } else if (data.pregnancy_status === 'postpartum') {
          this.userStatus = 'Postpartum';
          this.isPregnant = false;
          this.isPostpartum = true;

          // Update cycle settings
          this.cycleSettings.setUserStatus('Postpartum');
          this.cycleSettings.setPregnancyStatus(false);
          this.cycleSettings.setPostpartumStatus(true);
        } else {
          // Trying to conceive or tracking
          this.userStatus = 'Trying to Conceive';
          this.isPregnant = false;
          this.isPostpartum = false;

          // Update cycle settings
          this.cycleSettings.setUserStatus('Trying to Conceive');
          this.cycleSettings.setPregnancyStatus(false);
          this.cycleSettings.setPostpartumStatus(false);
        }

        // Set cycle data if provided
        if (data.cycle_length) {
          this.cycleSettings.setCycleLength(data.cycle_length);
        }
        if (data.period_length) {
          this.cycleSettings.setPeriodLength(data.period_length);
        }
        const lmpForCycle = normalizeLmpInput(data.lmp_date ?? data.last_period);
        if (lmpForCycle) {
          this.cycleSettings.setLastPeriodStart(lmpForCycle);
          this.periodStartDate = new Date(`${lmpForCycle}T12:00:00`);
          this.updateCycleDay();
        }
      } catch (error) {
        console.error('Error parsing onboarding data:', error);
      }
    } else {
    }
  }

  /**
   * Generate personalized messages for the user
   */
  generateMessages() {
    // Generate welcome message with user's name
    this.welcomeMessage = this.messageService.generateWelcomeMessage(
      this.userName,
    );

    // Generate daily inspirational message
    this.dailyMessage = this.messageService.generateDailyMessage();

    // You can also generate pregnancy-specific messages if needed
    // this.dailyMessage = this.messageService.generatePregnancyDailyMessage(28);
  }

  /**
   * Refresh the display based on current user status
   */
  refreshDisplay() {
    if (!this.authService.getAccessToken()) {
      this.loadPersistedData();
      this.checkOnboardingStatus();
      return;
    }
    this.loadDashboardState();
  }

  /**
   * Called when the page is about to enter
   * This ensures the chart is refreshed when returning from other pages
   */
  ionViewWillEnter() {
    // Default to compact mode each time user opens Home.
    this.showMoreSections = false;

    this.syncDashboardFromServerAndRefreshChart();
    if (this.isPregnant) {
      this.clearPregnancyCalendarSelectionIfInvalid();
    }
    this.scheduleScrollPregnancyCalendarToAnchor();
    setTimeout(() => this.schedulePregnancyConnectorUpdate(), 120);
    this.firstWeekPlan.ensurePlanStarted();
    this.runFirstWeekEntryHooks();
    this.refreshGrowthStrip();
  }

  private refreshGrowthStrip(): void {
    if (!this.authService.getAccessToken()) {
      this.growthStrip = {
        visible: false,
        streak: 0,
        points: 0,
        checkedInToday: false,
      };
      return;
    }
    this.growthService
      .getSummary()
      .pipe(catchError(() => of(null)))
      .subscribe((d) => {
        if (!d) {
          return;
        }
        this.growthStrip = {
          visible: true,
          streak: d.checkInStreak,
          points: d.growthPoints,
          checkedInToday: d.checkedInToday,
        };
        this.cdr.markForCheck();
      });
  }

  async onGrowthCheckIn(): Promise<void> {
    try {
      const res = await firstValueFrom(this.growthService.checkIn());
      this.growthStrip = {
        ...this.growthStrip,
        visible: true,
        streak: res.checkInStreak,
        points: res.growthPoints,
        checkedInToday: true,
      };
      const toast = await this.toastController.create({
        message: res.alreadyCheckedIn
          ? 'You already checked in today.'
          : 'Check-in saved — build your streak!',
        duration: 2200,
        color: res.alreadyCheckedIn ? 'medium' : 'success',
      });
      await toast.present();
    } catch {
      const t = await this.toastController.create({
        message: 'Check-in could not be saved. Try again.',
        duration: 2200,
        color: 'danger',
      });
      await t.present();
    }
    this.cdr.markForCheck();
  }

  async shareCycleInsight(): Promise<void> {
    try {
      const payload = await firstValueFrom(this.growthService.getShareSummary());
      const text = this.growthService.composeShareText(payload);
      if (navigator.share) {
        await navigator.share({ title: payload.title, text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        const toast = await this.toastController.create({
          message: 'Summary copied — paste anywhere to share.',
          duration: 2200,
        });
        await toast.present();
      }
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === 'AbortError') {
        return;
      }
      const t = await this.toastController.create({
        message: 'Could not load a share summary.',
        duration: 2000,
        color: 'danger',
      });
      await t.present();
    }
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
    this.loadRecentSymptomsDays();
    this.initializeHealthTip();

    if (!this.authService.getAccessToken()) {
      this.loadPersistedData();
      this.checkOnboardingStatus();
      this.runPeriodChartRefresh();
      this.cdr.markForCheck();
      return;
    }

    try {
      await firstValueFrom(
        forkJoin({
          dashboard: this.onboardingService.getDashboard(),
          journey: this.userInfoService
            .getUserOnboardingData()
            .pipe(catchError(() => of<UserInfo | null>(null))),
        }).pipe(
          tap(({ dashboard, journey }) => {
            const state = this.homeReproUi.synchronizeFromDashboardAndJourney(
              dashboard,
              journey,
            );
            this.applyJourneyStateToView(state);
          }),
        ),
      );
    } catch {
      // network errors: still refresh chart from local state
    } finally {
      this.runPeriodChartRefresh();
      this.refreshGrowthStrip();
      this.cdr.markForCheck();
    }
  }

  /**
   * One dashboard read per enter: week-detail save publishes via signal first, else GET.
   */
  private syncDashboardFromServerAndRefreshChart() {
    if (!this.authService.getAccessToken()) {
      this.runPeriodChartRefresh();
      return;
    }
    if (this.homeJourneyBridge.takeSkipNextRemoteDashboardFetch()) {
      const leftover = this.homeJourneyBridge.consumeSavedJourneyFromWeekDetail();
      if (leftover) {
        this.applyJourneyStateToView(leftover);
        this.cdr.markForCheck();
      }
      this.runPeriodChartRefresh();
      return;
    }
    forkJoin({
      dashboard: this.onboardingService.getDashboard(),
      journey: this.userInfoService
        .getUserOnboardingData()
        .pipe(catchError(() => of<UserInfo | null>(null))),
    }).subscribe({
      next: ({ dashboard, journey }) => {
        const state = this.homeReproUi.synchronizeFromDashboardAndJourney(
          dashboard,
          journey,
        );
        this.applyJourneyStateToView(state);
        this.runPeriodChartRefresh();
      },
      error: () => this.runPeriodChartRefresh(),
    });
  }

  private loadDashboardState() {
    if (!this.authService.getAccessToken()) {
      return;
    }
    if (this.homeJourneyBridge.takeSkipNextRemoteDashboardFetch()) {
      const leftover = this.homeJourneyBridge.consumeSavedJourneyFromWeekDetail();
      if (leftover) {
        this.applyJourneyStateToView(leftover);
        this.cdr.markForCheck();
      }
      return;
    }
    forkJoin({
      dashboard: this.onboardingService.getDashboard(),
      journey: this.userInfoService
        .getUserOnboardingData()
        .pipe(catchError(() => of<UserInfo | null>(null))),
    }).subscribe({
      next: ({ dashboard, journey }) => {
        const state = this.homeReproUi.synchronizeFromDashboardAndJourney(
          dashboard,
          journey,
        );
        this.applyJourneyStateToView(state);
      },
    });
  }

  private applyJourneyStateToView(state: HomePageJourneyState) {
    this.userStatus = state.userStatus;
    this.isPregnant = state.isPregnant;
    this.isPostpartum = state.isPostpartum;
    this.needsPregnancyInput = false;
    this.dashboardPregnancyTips = [];
    this.dashboardPregnancyInsight = null;
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
    if (state.cycleDayDirty) {
      this.updateCycleDay();
    }

    if (this.isPregnant) {
      this.recomputePregnancyStatsFromLmpIfAvailable();
      this.clearPregnancyCalendarSelectionIfInvalid();
      this.scheduleScrollPregnancyCalendarToAnchor();
    }
    this.schedulePregnancyConnectorUpdate();
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
    this.onboardingService
      .updateReproductiveState({
        state: 'pregnant',
        pregnancyStartDate: lmp,
        lastPeriodDate: lmp,
        cycleLength: Number(data.cycle_length) || undefined,
      })
      .subscribe({
        next: () => {
          sessionStorage.setItem(promotedKey, '1');
          this.isPromotingOnboardingPregnancy = false;
          this.syncDashboardFromServerAndRefreshChart();
        },
        error: () => {
          this.isPromotingOnboardingPregnancy = false;
        },
      });
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
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const diffDays = Math.max(
      0,
      Math.floor((todayUtc.getTime() - lmp.getTime()) / 86400000),
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
    const w = this.getPregnancyWeekForCalendarDay(this.pregnancyCalendarViewDate);
    if (w === null) {
      return;
    }
    if (w < this.pregnancyCalendarMinWeek || w > this.pregnancyCalendarMaxWeek) {
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
    if (this.isPregnant || this.isPostpartum) {
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

  /** First-week retention strip (days 1–7 after onboarding). */
  showFirstWeekRetentionCard(): boolean {
    if (this.isPregnant || this.isPostpartum) {
      return false;
    }
    if (this.cycleSettings.isPregnant() || this.cycleSettings.isPostpartum()) {
      return false;
    }
    return this.firstWeekPlan.isInFirstWeek();
  }

  getFirstWeekPlan() {
    return this.firstWeekPlan.getPlanForToday();
  }

  /** Contextual copy when the user has not added a last period yet. */
  getWellnessEmptyCopy(): { title: string; subtitle: string } {
    if (this.isPregnant) {
      return {
        title: 'No check-in logged yet today',
        subtitle: 'A quick mood or symptom note helps tips match how you feel this week.',
      };
    }
    if (this.isPostpartum) {
      return {
        title: 'How is today going?',
        subtitle: 'Sleep, mood, or feeding — a few seconds of logging builds a kinder picture over time.',
      };
    }
    if (this.showFirstWeekRetentionCard()) {
      return {
        title: 'Wellness for today',
        subtitle: 'Use the quick mood chips on the card above, or open the full tracker when you have a minute.',
      };
    }
    return {
      title: 'No symptoms logged today',
      subtitle: 'Tap + to add how you feel, or start with a simple mood.',
    };
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
        title: 'Add your last period to go further',
        body: 'Trying takes patience. One date unlocks fertile-window hints and a calmer daily home — under a minute.',
        features: ['Fertile days', 'Symptom patterns', 'Gentle reminders'],
      };
    }
    return {
      title: 'Start with your last period',
      body: 'Your cycle ring and day-by-day view stay empty until you add one date. It takes a few seconds.',
      features: ['Cycle ring', 'Daily context', 'Symptom trends'],
    };
  }

  hasQuickMoodLoggedToday(): boolean {
    const m = this.todaySymptoms?.mood;
    return typeof m === 'string' && m.trim().length > 0;
  }

  async logQuickMood(bucket: 'great' | 'okay' | 'low'): Promise<void> {
    const moodMap = { great: 'good', okay: 'okay', low: 'poor' } as const;
    const mood = moodMap[bucket];
    const today = new Date().toISOString().split('T')[0];
    const uid = this.homeData.getCurrentUserId();
    const existing = this.trackDataService.getTodayTrackData();
    const prevSymptoms = existing?.symptoms;
    const symptoms = Array.isArray(prevSymptoms) ? prevSymptoms : [];
    this.trackDataService.saveTrackData({
      userId: uid > 0 ? uid : 0,
      date: today,
      mood,
      energy: existing?.energy && existing.energy.length > 0 ? existing.energy : 'medium',
      symptoms,
      notes: existing?.notes ?? '',
      id: existing?.id,
      createdAt: existing?.createdAt,
      updatedAt: new Date().toISOString(),
    });
    this.todaySymptoms = {
      userId: uid,
      date: today,
      mood,
      energy: existing?.energy && existing.energy.length > 0 ? existing.energy : 'medium',
      symptoms: symptoms as SymptomsDto['symptoms'],
      notes: existing?.notes ?? '',
    };
    const msg =
      bucket === 'great'
        ? 'Saved — glad today feels lighter.'
        : bucket === 'okay'
          ? 'Thanks — noted for today.'
          : 'Got it — be gentle with yourself today.';
    await this.showToast(msg, 'success');
    this.cdr.markForCheck();
  }

  onFirstWeekOpenTrackerDay5(): void {
    const plan = this.firstWeekPlan.getPlanForToday();
    if (plan?.day !== 5) {
      return;
    }
    this.openSymptomsTracking();
  }

  async onCheckFirstWeekInsight(): Promise<void> {
    const plan = this.firstWeekPlan.getPlanForToday();
    if (!plan) {
      return;
    }
    if (this.isPregnant) {
      await this.showToast('Opening this week’s details for you.', 'success');
      this.openCurrentPregnancyWeekDetail();
      return;
    }
    await this.showToast('Here’s more context below — scroll unlocked.', 'success');
    this.showMoreSections = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      document.getElementById('home-today-insights')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 200);
  }

  private readonly firstWeekNotifPromptKey = 'first_week_browser_notif_prompted';

  private runFirstWeekEntryHooks(): void {
    if (!this.firstWeekPlan.isInFirstWeek()) {
      return;
    }
    const nudge = this.firstWeekPlan.consumeDailyNudgeIfDue();
    if (nudge.toastFallback) {
      void this.showToast(nudge.toastFallback, 'success');
    }
    void this.maybePromptBrowserNotificationForFirstWeek();
  }

  private async maybePromptBrowserNotificationForFirstWeek(): Promise<void> {
    if (typeof Notification === 'undefined') {
      return;
    }
    if (this.firstWeekPlan.getPlanDayNumber() !== 1) {
      return;
    }
    if (localStorage.getItem(this.firstWeekNotifPromptKey) === 'true') {
      return;
    }
    if (!this.firstWeekPlan.notificationsOptIn()) {
      return;
    }
    if (Notification.permission !== 'default') {
      return;
    }
    localStorage.setItem(this.firstWeekNotifPromptKey, 'true');
    await Notification.requestPermission();
  }

  /**
   * Server `reproductive_state` uses `cycle` (default) or `planning`; older clients stored
   * {@link userStatus} as "Cycle Tracking" for `cycle`. The compact cycle home layout applies to both.
   */
  isHomeCycleTrackingLayout(): boolean {
    return (
      this.userStatus === 'Trying to Conceive' || this.userStatus === 'Cycle Tracking'
    );
  }

  private runPeriodChartRefresh() {
    setTimeout(() => {
      if (this.periodChart) {
        this.periodChart.debugState();
        this.periodChart.refreshChart();
        this.periodChart.debugState();
      }
    }, 100);
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
    this.showToast('New daily message generated! ✨');
  }

  /**
   * Generate mood-based message
   */
  generateMoodMessage(mood: string) {
    const moodMessage = this.messageService.generateMoodBasedMessage(mood);
    this.showToast(moodMessage);
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

  // User Status Management
  async updateUserStatus() {
    const alert = await this.alertController.create({
      header: 'Update Your Status',
      message: 'Select your current status:',
      buttons: [
        {
          text: 'Trying to Conceive',
          handler: () => {
            this.userStatus = 'Trying to Conceive';
            this.isPregnant = false;
            this.isPostpartum = false;
            this.cycleSettings.setUserStatus('Trying to Conceive');
            this.cycleSettings.setPregnancyStatus(false);
            this.cycleSettings.setPostpartumStatus(false);
            this.showToast('Status updated to: Trying to Conceive');
          },
        },
        {
          text: 'Pregnant',
          handler: async () => {
            this.userStatus = 'Pregnant';
            this.isPregnant = true;
            this.isPostpartum = false;
            this.cycleSettings.setUserStatus('Pregnant');
            this.cycleSettings.setPregnancyStatus(true);
            this.cycleSettings.setPostpartumStatus(false);

            // Ask for pregnancy week
            const weekAlert = await this.alertController.create({
              header: '🎉 Congratulations!',
              message: 'What week of pregnancy are you in?',
              inputs: [
                {
                  name: 'week',
                  type: 'number',
                  placeholder: 'Enter week (4-40)',
                  min: 4,
                  max: 40,
                  value: 12,
                },
              ],
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel',
                },
                {
                  text: 'Set Week',
                  handler: (data) => {
                    const week = parseInt(data.week);
                    if (week >= 4 && week <= 40) {
                      this.updatePregnancyWeek(week);
                      const babyData = this.getCurrentBabySize();
                      this.showToast(
                        `🎉 Week ${week}: Your baby is the size of a ${babyData.size.split(' ')[0]}!`,
                      );
                    } else {
                      this.showToast(
                        'Please enter a valid week (4-40)',
                        'warning',
                      );
                    }
                  },
                },
              ],
            });
            await weekAlert.present();
          },
        },
        {
          text: 'Postpartum',
          handler: async () => {
            this.userStatus = 'Postpartum';
            this.isPregnant = false;
            this.isPostpartum = true;
            this.cycleSettings.setUserStatus('Postpartum');
            this.cycleSettings.setPregnancyStatus(false);
            this.cycleSettings.setPostpartumStatus(true);

            // Ask for postpartum week
            const weekAlert = await this.alertController.create({
              header: '👶 Welcome to Postpartum!',
              message: 'How many weeks postpartum are you?',
              inputs: [
                {
                  name: 'week',
                  type: 'number',
                  placeholder: 'Enter week (1-12)',
                  min: 1,
                  max: 12,
                  value: 1,
                },
              ],
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel',
                },
                {
                  text: 'Set Week',
                  handler: (data) => {
                    const week = parseInt(data.week);
                    if (week >= 1 && week <= 12) {
                      this.updatePostpartumWeek(week);
                      const postpartumData = this.getCurrentPostpartumData();
                      this.showToast(
                        `👶 Week ${week}: ${postpartumData.recovery} - You're doing amazing!`,
                      );
                    } else {
                      this.showToast(
                        'Please enter a valid week (1-12)',
                        'warning',
                      );
                    }
                  },
                },
              ],
            });
            await weekAlert.present();
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await alert.present();
  }

  // Pregnancy Progress
  viewPregnancyDetails() {
    const w = this.getPregnancyWeekDetailRouteParam();
    this.router.navigate(['/week-detail'], {
      queryParams: { week: w },
    });
    this.showToast('Opening week ' + w + ' details...');
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
    const match = all.find((d) => d.week === this.getPregnancyWeekDetailRouteParam());
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
        `Week ${newClinical}: Your baby is now the size of a ${this.getCurrentBabySize().size.split(' ')[0]}! 🎉`,
      );
    }
  }

  // Postpartum methods
  getCurrentPostpartumData() {
    const currentData = this.postpartumData.find(
      (data) => data.week === this.postpartumWeek,
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
        `Week ${newWeek}: ${postpartumData.recovery} - ${postpartumData.tips} 💕`,
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
      header: 'Reschedule Appointment',
      message: `Reschedule ${appointment.title} with ${appointment.doctor}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Reschedule',
          handler: () => {
            this.router.navigate(['/tabs/consultation']);
            this.showToast('Opening appointment booking...');
          },
        },
      ],
    });
    await alert.present();
  }

  async cancelAppointment(appointment: any) {
    const alert = await this.alertController.create({
      header: 'Cancel Appointment',
      message: `Are you sure you want to cancel ${appointment.title}?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          handler: () => {
            this.upcomingAppointments = this.upcomingAppointments.filter(
              (apt) => apt !== appointment,
            );
            this.showToast('Appointment cancelled');
          },
        },
      ],
    });
    await alert.present();
  }

  bookNewAppointment() {
    this.router.navigate(['/tabs/consultation']);
    this.showToast('Opening appointment booking...');
  }

  // Open daily tracking modal
  async openDailyTracking() {
    const alert = await this.alertController.create({
      header: '📊 Track Today',
      message: 'What would you like to track today?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: '📝 Symptoms & Mood',
          handler: () => {
            this.openSymptomsTracking();
          },
        },
        {
          text: '💊 Medications',
          handler: () => {
            this.openMedicationReminder();
          },
        },
        {
          text: '🥗 Nutrition',
          handler: () => {
            this.openNutritionTracker();
          },
        },
        {
          text: '🏃‍♀️ Exercise',
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
      header: '📅 Calendar View',
      message: "Choose what you'd like to view in your calendar:",
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: '📊 Cycle Tracking',
          handler: () => {
            this.router.navigate(['/tools']);
            this.showToast('Opening cycle tracking calendar...', 'success');
          },
        },
        {
          text: '📝 Symptoms Log',
          handler: () => {
            this.router.navigate(['/tools']);
            this.showToast('Opening symptoms calendar...', 'success');
          },
        },
        {
          text: '💊 Medication Schedule',
          handler: () => {
            this.router.navigate(['/tools']);
            this.showToast('Opening medication calendar...', 'success');
          },
        },
        {
          text: '📅 Appointments',
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
        if (this.isPregnant) {
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
      header: '🎉 Congratulations!',
      message:
        "This is wonderful news! Let's update your status and guide you through the next steps.",
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Update Status',
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
      header: 'Update Status',
      message:
        'Are you sure you want to change your status back to "Trying to Conceive"?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Update Status',
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
      await new Promise<void>((resolve, reject) => {
        this.onboardingService
          .updateReproductiveState({ state: 'cycle' })
          .subscribe({ next: () => resolve(), error: () => reject() });
      });

      this.userStatus = 'Trying to Conceive';
      this.isPregnant = false;
      this.isPostpartum = false;

      // Reset pregnancy-related data
      this.pregnancyWeek = 0;
      this.pregnancyProgress = 0;

      // Save to persistent storage
      this.cycleSettings.setUserStatus('Trying to Conceive');
      this.cycleSettings.setPregnancyStatus(false);
      this.cycleSettings.setPostpartumStatus(false);
      this.cycleSettings.setPregnancyWeek(0);
      this.cycleSettings.setPregnancyProgress(0);

      // Update onboarding data in localStorage
      this.updateOnboardingData('trying');

      // Refresh the display to show cycle tracking
      this.refreshDisplay();

      const successAlert = await this.alertController.create({
        header: '✅ Status Updated!',
        message:
          'Your status has been updated back to "Trying to Conceive". You can now track your cycle again.',
        buttons: [
          {
            text: 'Continue',
            role: 'cancel',
          },
        ],
      });

      await successAlert.present();

      // Show success toast
      this.showToast(
        'Status updated successfully! You can now track your cycle.',
        'success',
      );
    } catch (error) {
      console.error('Error updating status:', error);
      this.showToast('Error updating status. Please try again.', 'danger');
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
    const { data, role } = await modal.onWillDismiss<InitializeReproductiveStateDto>();
    if (role !== 'confirm' || !data) {
      return;
    }
    try {
      await firstValueFrom(this.onboardingService.updateReproductiveState(data));
      await this.runPullToRefresh();
      await this.showToast('Pregnancy dates saved.', 'success');
    } catch (err: any) {
      const msg =
        err?.error?.message ??
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null);
      await this.showToast(
        typeof msg === 'string' ? msg : 'Could not save. Check your dates and try again.',
        'danger',
      );
    }
  }

  // Open symptoms tracking
  openSymptomsTracking() {
    this.router.navigate(['/symptoms-tracker']);
    this.showToast('Opening symptom tracker...');
  }

  // Open symptoms tracking for update mode
  openSymptomsTrackingForUpdate() {
    const today = this.getCurrentDate();
    this.router.navigate(['/symptoms-tracker'], {
      queryParams: {
        date: today,
        mode: 'update',
      },
    });
    this.showToast('Opening symptom tracker for update...');
  }

  // Navigate to school (baby development)
  navigateToSchool() {
    this.router.navigate(['/tabs/school']);
    this.showToast('Opening baby development...');
  }

  // Open nutrition guide
  openNutritionGuide() {
    this.showToast('Nutrition guide coming soon...');
  }

  // Symptoms Summary Methods
  todaySymptoms: SymptomsDto = {} as SymptomsDto;

  loadTodaySymptoms() {
    const today = new Date().toISOString().split('T')[0];

    // First try to get from local service (faster)
    const localData = this.trackDataService.getTodayTrackData();
    if (localData) {
      this.todaySymptoms = localData as SymptomsDto;
      console.log('🔍 Today symptoms from local service:', this.todaySymptoms);
      return;
    }

    // If not found locally, fetch from API

    this.trackDataService
      .getTrackDay(this.homeData.getCurrentUserId(), today)
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.todaySymptoms = data[0] as SymptomsDto;

            // Store in local service for future use
            this.trackDataService.saveTrackData({
              id: data[0].id,
              userId: this.homeData.getCurrentUserId(),
              date: today,
              symptoms: data[0].symptoms,
              mood: data[0].mood,
              energy: data[0].energy,
              notes: data[0].notes,
              createdAt: data[0].createdAt,
              updatedAt: data[0].updatedAt,
            });
          }
          console.log('🔍 Today symptoms from API:', this.todaySymptoms);
        },
        error: (error) => {
          this.todaySymptoms = {} as SymptomsDto;
        },
      });
  }

  getMoodIcon(mood: string): string {
    const moodIcons: { [key: string]: string } = {
      excellent: 'happy-outline',
      good: 'happy-outline',
      okay: 'remove-outline',
      poor: 'sad-outline',
      terrible: 'sad-outline',
    };
    return moodIcons[mood] || 'remove-outline';
  }

  getEnergyIcon(energy: string): string {
    const energyIcons: { [key: string]: string } = {
      high: 'flash-outline',
      medium: 'battery-half-outline',
      low: 'battery-dead-outline',
    };
    return energyIcons[energy] || 'help-outline';
  }

  getSeverityColor(severity: string): string {
    const severityColors: { [key: string]: string } = {
      mild: 'success',
      moderate: 'warning',
      severe: 'danger',
    };
    return severityColors[severity] || 'medium';
  }

  viewSymptomsHistory() {
    this.router.navigate(['/symptoms-history']);
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
  recentSymptomsDays: any[] = [];

  getRecentSymptomsDays(): any[] {
    return this.recentSymptomsDays;
  }

  loadRecentSymptomsDays() {
    // Skip loading recent days - only show today's data
    this.recentSymptomsDays = [];
  }

  getDayName(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
        `${moodEmoji[mood]} Symptoms tracked successfully!`,
        'success',
      );
    } catch (error) {
      await this.showToast(
        'Failed to track symptoms. Please try again.',
        'danger',
      );
    }
  }

  // Open appointment booking
  async openAppointmentBooking() {
    const alert = await this.alertController.create({
      header: '📅 Book Appointment',
      message: 'Choose the type of consultation you need:',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Prenatal Care',
          handler: () => {
            this.bookAppointment('prenatal');
          },
        },
        {
          text: 'Nutrition Consultation',
          handler: () => {
            this.bookAppointment('nutrition');
          },
        },
        {
          text: 'Mental Health Support',
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
      const typeNames: Record<string, string> = {
        prenatal: 'Prenatal Care',
        nutrition: 'Nutrition Consultation',
        mental_health: 'Mental Health Support',
      };

      await this.showToast(`Opening ${typeNames[type]} booking...`, 'success');

      const successAlert = await this.alertController.create({
        header: '✅ Appointment Booking',
        message: `You're being redirected to book your ${typeNames[type]} appointment.`,
        buttons: ['OK'],
      });

      await successAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to open appointment booking. Please try again.',
        'danger',
      );
    }
  }

  // Navigate to community
  async navigateToCommunity() {
    try {
      await this.showToast('Joining community...', 'success');

      const communityAlert = await this.alertController.create({
        header: '👥 Join Our Community',
        message:
          'Connect with other women on similar journeys. Share experiences, ask questions, and find support.',
        buttons: [
          {
            text: 'Learn More',
            handler: () => {
              // Navigate to community page
              this.router.navigate(['/tabs/social']);
            },
          },
          {
            text: 'Continue',
            role: 'cancel',
          },
        ],
      });

      await communityAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to join community. Please try again.',
        'danger',
      );
    }
  }

  // Daily Tips Actions
  async viewCounselorSchedule() {
    try {
      await this.showToast('Opening counselor schedule...', 'success');

      const scheduleAlert = await this.alertController.create({
        header: '👩‍⚕️ Counselor Schedule',
        message: 'View available appointment slots with our expert counselors.',
        buttons: [
          {
            text: 'View Schedule',
            handler: () => {
              // Navigate to schedule page
              // this.router.navigate(['/counselor-schedule']);
            },
          },
          {
            text: 'Continue',
            role: 'cancel',
          },
        ],
      });

      await scheduleAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to open schedule. Please try again.',
        'danger',
      );
    }
  }

  // Expert Actions
  async bookExpertConsultation() {
    try {
      await this.showToast('Opening expert consultation booking...', 'success');

      const consultationAlert = await this.alertController.create({
        header: '👨‍⚕️ Expert Consultation',
        message:
          'Book a consultation with our specialized experts in prenatal care, nutrition, and mental health.',
        buttons: [
          {
            text: 'Book Now',
            handler: () => {
              // Navigate to booking page
              this.router.navigate(['/tabs/consultation']);
            },
          },
          {
            text: 'Continue',
            role: 'cancel',
          },
        ],
      });

      await consultationAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to open consultation booking. Please try again.',
        'danger',
      );
    }
  }

  // Community Actions
  async joinCommunity() {
    await this.navigateToCommunity();
  }

  toggleMoreSections() {
    this.showMoreSections = !this.showMoreSections;
  }

  // Floating Action Button
  async openQuickMenu() {
    const actionSheet = await this.alertController.create({
      header: 'Quick Actions',
      buttons: [
        {
          text: '🤖 Chat with Assistant',
          handler: () => {
            this.router.navigate(['/chatbot']);
          },
        },
        {
          text: '📝 Add Symptom Entry',
          handler: () => {
            this.openSymptomsTracking();
          },
        },
        {
          text: '📅 Book Appointment',
          handler: () => {
            this.openAppointmentBooking();
          },
        },
        {
          text: '📊 View Progress',
          handler: () => {
            this.router.navigate(['tabs/tools']);
          },
        },
        {
          text: '❌ Cancel',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }

  // Health Tools Methods
  async openFertilityCalculator() {
    try {
      const calculatorAlert = await this.alertController.create({
        header: '🧮 Fertility Calculator',
        message:
          'Calculate your most fertile days based on your cycle length and last period date.',
        buttons: [
          {
            text: 'Open Calculator',
            handler: async () => {
              await this.showToast(
                'Opening fertility calculator...',
                'success',
              );
              // Navigate to tools page and trigger fertility calculator
              this.router.navigate(['/tools'], {
                queryParams: { openTool: 'fertility' },
              });
            },
          },
          {
            text: 'Continue',
            handler: async () => {
              // Show inline fertility calculator
              await this.showInlineFertilityCalculator();
            },
          },
        ],
      });

      await calculatorAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to open fertility calculator. Please try again.',
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
      await this.showToast(
        'Failed to open calculator. Please try again.',
        'danger',
      );
    }
  }

  // Regular fertility calculator for non-pregnant users
  async showRegularFertilityCalculator() {
    const alert = await this.alertController.create({
      header: '🧮 Fertility Calculator',
      message:
        'Calculate your most fertile days based on your cycle length and last period date.',
      inputs: [
        {
          name: 'cycleLength',
          type: 'number',
          placeholder: 'Cycle length (days)',
          min: 21,
          max: 35,
          value: 28,
        },
        {
          name: 'lastPeriod',
          type: 'date',
          placeholder: 'Last period start date',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Calculate',
          handler: async (data) => {
            if (data.cycleLength && data.lastPeriod) {
              await this.calculateFertileDays(
                data.cycleLength,
                data.lastPeriod,
              );
            } else {
              await this.showToast('Please fill in all fields', 'warning');
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
      header: '🤰 Pregnancy Week Calculator',
      message:
        'Calculate your current pregnancy week based on your last menstrual period (LMP) date.',
      inputs: [
        {
          name: 'lastPeriod',
          type: 'date',
          placeholder: 'Last menstrual period date',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Calculate Week',
          handler: async (data) => {
            if (data.lastPeriod) {
              await this.calculatePregnancyWeek(data.lastPeriod);
            } else {
              await this.showToast('Please enter your LMP date', 'warning');
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
        return date.toLocaleDateString('en-US', {
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

      await this.showToast('Fertile days calculated successfully!', 'success');
    } catch (error) {
      console.error('Error calculating fertile days:', error);
      await this.showToast('Failed to calculate fertile days', 'danger');
    }
  }

  // Calculate pregnancy week
  private async calculatePregnancyWeek(lastPeriod: string) {
    try {
      const lmpIso = isoDateOnly(lastPeriod) ?? String(lastPeriod).slice(0, 10);
      const pregnancyWeek = gestationalWeekFromLmp(lmpIso);
      const lmpDate = new Date(
        lmpIso.includes('T') ? lmpIso : `${lmpIso}T12:00:00`,
      );
      const lm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lmpIso);
      const t = new Date();
      const uL = lm
        ? Date.UTC(Number(lm[1]), Number(lm[2]) - 1, Number(lm[3]))
        : Date.UTC(
            lmpDate.getFullYear(),
            lmpDate.getMonth(),
            lmpDate.getDate(),
          );
      const uT = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
      const daysDifference = Math.max(0, Math.floor((uT - uL) / (1000 * 60 * 60 * 24)));

      // Validate pregnancy week
      if (pregnancyWeek < 4 || pregnancyWeek > 42) {
        await this.showToast(
          'Invalid date. Please enter a valid LMP date (4-42 weeks ago).',
          'warning',
        );
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
        return date.toLocaleDateString('en-US', {
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
              'Pregnancy week updated in your profile!',
              'success',
            );
            break;
          case 'trackSymptoms':
            await this.openSymptomsTracking();
            break;
          case 'setAppointment':
            await this.showToast('Appointment booking coming soon!', 'warning');
            break;
        }
      }
    } catch (error) {
      console.error('Error calculating pregnancy week:', error);
      await this.showToast('Failed to calculate pregnancy week', 'danger');
    }
  }

  // Set fertility reminder
  private async setFertilityReminder(results: FertilityResults) {
    try {
      const reminderAlert = await this.alertController.create({
        header: '🔔 Set Fertility Reminder',
        message:
          "Choose when you'd like to be reminded about your fertile window:",
        inputs: [
          {
            name: 'reminderType',
            type: 'radio',
            label: '1 day before fertile window',
            value: '1day',
            checked: true,
          },
          {
            name: 'reminderType',
            type: 'radio',
            label: '2 days before fertile window',
            value: '2days',
          },
          {
            name: 'reminderType',
            type: 'radio',
            label: 'On ovulation day',
            value: 'ovulation',
          },
          {
            name: 'reminderType',
            type: 'radio',
            label: 'Daily during fertile window',
            value: 'daily',
          },
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Set Reminder',
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
      await this.showToast('Failed to set reminder', 'danger');
    }
  }

  // Schedule fertility reminder
  private async scheduleFertilityReminder(
    results: FertilityResults,
    reminderType: string,
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
          reminderMessage = `🌟 Your fertile window starts tomorrow! Get ready for your most fertile days.`;
          break;
        case '2days':
          reminderDate = new Date(fertileStartDate);
          reminderDate.setDate(reminderDate.getDate() - 2);
          reminderMessage = `🌟 Your fertile window starts in 2 days! Time to prepare.`;
          break;
        case 'ovulation':
          reminderDate = ovulationDate;
          reminderMessage = `🥚 Today is your ovulation day! Peak fertility time.`;
          break;
        case 'daily':
          reminderMessage = `🌟 You're in your fertile window! Today is a high fertility day.`;
          break;
        default:
          reminderDate = new Date(fertileStartDate);
          reminderMessage = `🌟 Your fertile window is starting!`;
      }

      // Store reminder in localStorage (in a real app, you'd use proper notification scheduling)
      const reminders = JSON.parse(
        localStorage.getItem('fertilityReminders') || '[]',
      );

      if (reminderType === 'daily') {
        // Add daily reminders for each fertile day
        results.fertileDays.forEach((day, index) => {
          const dayDate = new Date(day);
          reminders.push({
            id: `fertility_daily_${index}_${Date.now()}`,
            date: dayDate.toISOString().split('T')[0],
            message: `🌟 Day ${index + 1} of your fertile window! High fertility day.`,
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
        header: '✅ Reminder Set!',
        message: `Your fertility reminder has been scheduled. You'll be notified at the right time to maximize your chances of conception.`,
        buttons: [
          {
            text: 'View All Reminders',
            handler: () => {
              this.showAllReminders();
            },
          },
          {
            text: 'Done',
            role: 'cancel',
          },
        ],
      });

      await successAlert.present();
      await this.showToast(
        'Fertility reminder set successfully! 🔔',
        'success',
      );
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      await this.showToast('Failed to schedule reminder', 'danger');
    }
  }

  // Show all reminders
  private async showAllReminders() {
    try {
      const reminders = JSON.parse(
        localStorage.getItem('fertilityReminders') || '[]',
      );
      const activeReminders = reminders.filter((r: any) => r.isActive);

      if (activeReminders.length === 0) {
        await this.showToast('No active reminders found', 'warning');
        return;
      }

      const remindersList = activeReminders
        .map((reminder: any) => {
          const date = new Date(reminder.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          return `• ${date}: ${reminder.message}`;
        })
        .join('\n');

      const remindersAlert = await this.alertController.create({
        header: '🔔 Your Fertility Reminders',
        message: `Active reminders:\n\n${remindersList}`,
        buttons: [
          {
            text: 'Clear All',
            handler: () => {
              this.clearAllReminders();
            },
          },
          {
            text: 'Done',
            role: 'cancel',
          },
        ],
      });

      await remindersAlert.present();
    } catch (error) {
      console.error('Error showing reminders:', error);
      await this.showToast('Failed to load reminders', 'danger');
    }
  }

  // Clear all reminders
  private async clearAllReminders() {
    try {
      const confirmAlert = await this.alertController.create({
        header: 'Clear All Reminders',
        message: 'Are you sure you want to clear all fertility reminders?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Clear All',
            handler: () => {
              localStorage.removeItem('fertilityReminders');
              this.showToast('All reminders cleared', 'success');
            },
          },
        ],
      });

      await confirmAlert.present();
    } catch (error) {
      console.error('Error clearing reminders:', error);
      await this.showToast('Failed to clear reminders', 'danger');
    }
  }

  // Export fertility results
  private async exportFertilityResults(results: FertilityResults) {
    try {
      // Check if user is on mobile device first
      const isMobile = this.detectMobileDevice();

      // Only allow sharing on mobile devices
      if (!isMobile) {
        await this.showToast(
          'Sharing is only available on mobile devices',
          'warning',
        );
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
          await this.showToast('Results shared successfully!', 'success');
        } catch (shareError) {
          console.log('Native share failed, using fallback:', shareError);
          await this.fallbackShare(shareText, isMobile);
        }
      } else {
        await this.fallbackShare(shareText, isMobile);
      }
    } catch (error) {
      console.error('Error sharing results:', error);
      await this.showToast('Failed to share results', 'danger');
    }
  }

  // Fallback share methods
  private async fallbackShare(shareText: string, isMobile: boolean) {
    try {
      if (isMobile) {
        // Mobile fallback: Show options for different sharing methods
        const shareAlert = await this.alertController.create({
          header: '📤 Share Results',
          message: "Choose how you'd like to share your fertility results:",
          buttons: [
            {
              text: '📋 Copy to Clipboard',
              handler: async () => {
                await this.copyToClipboard(shareText);
              },
            },
            {
              text: '📱 SMS/WhatsApp',
              handler: () => {
                this.shareViaSMS(shareText);
              },
            },
            {
              text: '📧 Email',
              handler: () => {
                this.shareViaEmail(shareText);
              },
            },
            {
              text: 'Cancel',
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
      await this.showToast('Unable to share. Please try again.', 'danger');
    }
  }

  // Copy to clipboard with better error handling
  private async copyToClipboard(text: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        await this.showToast('Results copied to clipboard!', 'success');
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
          await this.showToast('Results copied to clipboard!', 'success');
        } catch (err) {
          await this.showToast(
            'Please manually copy the text from the alert',
            'warning',
          );
          // Show the text in an alert for manual copying
          const textAlert = await this.alertController.create({
            header: '📋 Copy This Text',
            message: `<div style="font-family: monospace; font-size: 12px; text-align: left; white-space: pre-line; max-height: 300px; overflow-y: auto;">${text}</div>`,
            buttons: ['OK'],
          });
          await textAlert.present();
        }

        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      await this.showToast('Copy failed. Please try another method.', 'danger');
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
          header: '📱 Alternative Sharing',
          message: "If WhatsApp didn't open, you can try SMS instead.",
          buttons: [
            {
              text: 'Open SMS',
              handler: () => {
                window.open(smsUrl, '_blank');
              },
            },
            {
              text: 'Cancel',
              role: 'cancel',
            },
          ],
        });
        fallbackAlert.then((alert) => alert.present());
      }, 2000);
    } catch (error) {
      console.error('SMS share failed:', error);
      this.showToast('Unable to open messaging app', 'danger');
    }
  }

  // Share via Email
  private shareViaEmail(text: string) {
    try {
      const subject = encodeURIComponent('My Fertility Calendar Results');
      const body = encodeURIComponent(text);
      const emailUrl = `mailto:?subject=${subject}&body=${body}`;

      window.open(emailUrl, '_blank');
      this.showToast('Opening email app...', 'success');
    } catch (error) {
      console.error('Email share failed:', error);
      this.showToast('Unable to open email app', 'danger');
    }
  }

  async openNutritionTracker() {
    try {
      await this.showToast('Opening nutrition tracker...', 'success');

      const nutritionAlert = await this.alertController.create({
        header: '🥗 Nutrition Tracker',
        message:
          'Track your daily nutrition intake, including vitamins, minerals, and food groups essential for pregnancy.',
        buttons: [
          {
            text: 'Start Tracking',
            handler: () => {
              this.router.navigate(['/tabs/insights']);
            },
          },
          {
            text: 'Continue',
            role: 'cancel',
          },
        ],
      });

      await nutritionAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to open nutrition tracker. Please try again.',
        'danger',
      );
    }
  }

  async openExercisePlanner() {
    try {
      await this.showToast('Opening exercise planner...', 'success');

      const exerciseAlert = await this.alertController.create({
        header: '🏃‍♀️ Exercise Planner',
        message:
          'Get personalized exercise recommendations safe for each trimester of pregnancy.',
        buttons: [
          {
            text: 'View Exercises',
            handler: () => {
              this.router.navigate(['/tabs/insights']);
            },
          },
          {
            text: 'Continue',
            role: 'cancel',
          },
        ],
      });

      await exerciseAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to open exercise planner. Please try again.',
        'danger',
      );
    }
  }

  async openMedicationReminder() {
    try {
      await this.showToast('Opening medication reminder...', 'success');

      const medicationAlert = await this.alertController.create({
        header: '💊 Medication Reminder',
        message:
          'Set reminders for your prenatal vitamins and medications to ensure you never miss a dose.',
        buttons: [
          {
            text: 'Set Reminders',
            handler: () => {
              this.router.navigate(['/tabs/insights']);
            },
          },
          {
            text: 'Continue',
            role: 'cancel',
          },
        ],
      });

      await medicationAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to open medication reminder. Please try again.',
        'danger',
      );
    }
  }

  // Postpartum-specific methods
  async openFeedingTracker() {
    try {
      await this.showToast('Opening feeding tracker...', 'success');

      const feedingAlert = await this.alertController.create({
        header: '🍼 Feeding Tracker',
        message:
          "Track your baby's feeding schedule, duration, and patterns to ensure proper nutrition.",
        buttons: [
          {
            text: 'Start Tracking',
            handler: () => {
              this.router.navigate(['/tools']);
            },
          },
          {
            text: 'Continue',
            role: 'cancel',
          },
        ],
      });

      await feedingAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to open feeding tracker. Please try again.',
        'danger',
      );
    }
  }

  async openSleepTracker() {
    try {
      await this.showToast('Opening sleep tracker...', 'success');

      const sleepAlert = await this.alertController.create({
        header: '😴 Sleep Tracker',
        message:
          "Monitor your baby's sleep patterns, duration, and quality to establish healthy sleep habits.",
        buttons: [
          {
            text: 'Start Tracking',
            handler: () => {
              this.router.navigate(['/tools']);
            },
          },
          {
            text: 'Continue',
            role: 'cancel',
          },
        ],
      });

      await sleepAlert.present();
    } catch (error) {
      await this.showToast(
        'Failed to open sleep tracker. Please try again.',
        'danger',
      );
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

  // Open period date picker modal
  async openPeriodDatePicker() {
    const modal = await this.modalController.create({
      component: PeriodDatePickerPageComponent,
      componentProps: {},
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      backdropDismiss: false,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.onPeriodDateSelected(data);
    }
  }

  // Handle period date selection from the date picker modal
  onPeriodDateSelected(periodRange: PeriodDateRange) {
    this.showToast('Period logged successfully!', 'success');

    // Update user status to "Trying to Conceive" to show the period chart
    this.userStatus = 'Trying to Conceive';
    this.isPregnant = false;
    this.isPostpartum = false;

    // Set the period start date and update cycle day
    this.periodStartDate = periodRange.startDate;
    this.updateCycleDay();

    // Save to persistent storage
    this.cycleSettings.setUserStatus('Trying to Conceive');
    this.cycleSettings.setPregnancyStatus(false);
    this.cycleSettings.setPostpartumStatus(false);
    const periodDayIso = periodRange.startDate.toISOString().split('T')[0];
    this.cycleSettings.setLastPeriodStart(periodDayIso);
    this.periodHistory.addEntry(periodDayIso);
    this.currentCycleLength = this.cycleSettings.cycleLength();
    this.periodLength = this.cycleSettings.periodLength();

    if (this.authService.getAccessToken()) {
      this.userInfoService
        .patchMeOnboarding({
          pregnancyStatus: 'PLANNING_PREGNANCY',
          lastPeriodDate: periodDayIso,
          cycleLength: this.cycleSettings.cycleLength(),
          periodLength: this.cycleSettings.periodLength(),
        })
        .subscribe({
          next: () => this.runPeriodChartRefresh(),
          error: () => this.runPeriodChartRefresh(),
        });
    } else {
      this.runPeriodChartRefresh();
    }
    this.cdr.markForCheck();
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
      selectedDate.getTime() - pregnancyStartDate.getTime(),
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.pregnancyDays = diffDays;
    this.pregnancyWeek = Math.min(42, Math.max(1, Math.floor(diffDays / 7) + 1));
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
    this.pregnancyProgress = Math.min(100, Math.round((this.pregnancyDays / 280) * 100));
    this.updateBabySize();
  }

  onDateChange(event: any) {
    const selectedDate = new Date(event.detail.value);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - selectedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.pregnancyDays = diffDays;
    this.pregnancyWeek = Math.min(42, Math.max(1, Math.floor(diffDays / 7) + 1));
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
    color: 'success' | 'danger' | 'warning' = 'success',
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
    if (diff === 0) return 'Today';
    if (diff > 0) return `In ${diff} days`;
    return `${Math.abs(diff)} days ago`;
  }

  getCycleDayStatus(): string {
    if (this.currentCycleDay <= 0) return 'Not tracking';
    if (this.currentCycleDay <= this.periodLength) return 'Period Day';
    if (this.currentCycleDay <= 14) return 'Follicular Phase';
    if (this.currentCycleDay <= 28) return 'Luteal Phase';
    return 'Next Cycle';
  }

  getCycleDayDescription(): string {
    if (this.currentCycleDay <= 0) return 'Start tracking your cycle';
    if (this.currentCycleDay <= this.periodLength)
      return `Day ${this.currentCycleDay} of your period`;
    if (this.currentCycleDay <= 14)
      return 'Your body is preparing for ovulation';
    if (this.currentCycleDay <= 28)
      return 'Your body is preparing for the next period';
    return 'Time to start tracking your next cycle';
  }

  updateCycleDay() {
    if (!this.periodStartDate) {
      this.currentCycleDay = 0;
      return;
    }

    const today = new Date();
    const startDate = new Date(this.periodStartDate);
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.currentCycleDay = diffDays + 1; // +1 because day 1 is the start date
  }

  // Detect if user is on mobile device
  private detectMobileDevice(): boolean {
    // Check for mobile device using multiple methods
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for mobile user agents
    const isMobileUserAgent =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase(),
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
    if (hour < 12) return 'Good Morning! ☀️';
    if (hour < 17) return 'Good Afternoon! 🌤️';
    return 'Good Evening! 🌙';
  }

  getPersonalizedMessage(): string {
    if (this.isPregnant) {
      return `You're in week ${this.getPregnancyDisplayWeek()}, day ${this.getPregnancyDayDisplay()}. How are you feeling today?`;
    }
    if (this.isHomeCycleTrackingLayout()) {
      return `Day ${this.currentCycleDay} of your cycle. Let's track your journey together.`;
    }
    if (this.isPostpartum) {
      return 'Welcome to your postpartum journey. Take care of yourself.';
    }
    return "Ready to start your health journey? Let's begin tracking!";
  }

  getStatusIcon(): string {
    if (this.isPregnant) return 'heart';
    if (this.isHomeCycleTrackingLayout()) return 'analytics';
    if (this.isPostpartum) return 'flower';
    return 'calendar';
  }

  getStatusIconClass(): string {
    if (this.isPregnant) return 'pregnant-status';
    if (this.isHomeCycleTrackingLayout()) return 'ttc-status';
    if (this.isPostpartum) return 'postpartum-status';
    return 'default-status';
  }

  getStatusTitle(): string {
    if (this.isPregnant)
      return `Week ${this.getPregnancyDisplayWeek()}, day ${this.getPregnancyDayDisplay()}`;
    if (this.isHomeCycleTrackingLayout()) return 'Tracking Fertility';
    if (this.isPostpartum) return 'Postpartum Care';
    return 'Start Tracking';
  }

  getStatusDescription(): string {
    if (this.isPregnant) return `Your baby is growing beautifully!`;
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
    if (!this.isPregnant || !this.pregnancyCalendarViewDate) {
      return this.pregnancyWeek;
    }
    return this.computePregnancyWeekForDate(this.pregnancyCalendarViewDate);
  }

  /** Week 41+ (after completed week 40) — show full-term reassurance UI. */
  isPregnancyPostDueWindow(): boolean {
    if (!this.isPregnant || this.needsPregnancyInput) {
      return false;
    }
    return this.getPregnancyDisplayWeek() > 40;
  }

  /** Day within current pregnancy week (0–6), or from calendar pick. */
  getPregnancyDayDisplay(): number {
    if (!this.isPregnant) {
      return 0;
    }
    if (!this.pregnancyCalendarViewDate) {
      return this.pregnancyDayInWeek;
    }
    const d = this.getCalendarDaysSinceLmp(this.pregnancyCalendarViewDate);
    if (d === null) {
      return this.pregnancyDayInWeek;
    }
    return d % 7;
  }

  getPregnancyWeekDetailRouteParam(): number {
    const w = this.getPregnancyDisplayWeek();
    return Math.min(40, Math.max(1, w));
  }

  /** LMP string `YYYY-MM-DD` → UTC ms at that civil date 00:00 UTC (matches server date-only LMP). */
  private getLmpUtcMidnightMs(): number | null {
    if (!this.pregnancyStartDate) {
      return null;
    }
    const head = isoDateOnly(this.pregnancyStartDate);
    if (!head) {
      return null;
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(head);
    if (!m) {
      return null;
    }
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
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

    for (let w = -this.pregnancyCalWeeksPast; w <= this.pregnancyCalWeeksFuture; w++) {
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
        weekKey: `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`,
        days,
      });
    }

    return weeks;
  }

  isPregnancyCalendarFutureDay(d: {
    fullDate: Date;
  }): boolean {
    const today = new Date();
    const u0 = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const u1 = Date.UTC(
      d.fullDate.getFullYear(),
      d.fullDate.getMonth(),
      d.fullDate.getDate(),
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

  isPregnancyCalendarDaySelected(d: { isToday: boolean; isoKey: string }): boolean {
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
        d.fullDate.getDate(),
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
    if (!this.isPregnant || this.needsPregnancyInput) {
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
      '.pregnancy-calendar-col--selected:not(:disabled)',
    );
    const disk = wrap.querySelector<HTMLElement>('.pregnancy-hero-disk');
    if (!selected || !disk) {
      this.pregnancyConnector = null;
      return;
    }
    const dateEl =
      selected.querySelector<HTMLElement>('.pregnancy-calendar-date') ?? selected;
    const wr = wrap.getBoundingClientRect();
    const dr = dateEl.getBoundingClientRect();
    const hr = disk.getBoundingClientRect();
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const x1 = dr.left + dr.width / 2 - wr.left;
    const y1 = dr.bottom - wr.top + 0.5;
    const x2 = hr.left + hr.width / 2 - wr.left;
    const y2 = hr.top - wr.top + 12;
    if (y2 <= y1 + 8) {
      this.pregnancyConnector = null;
      return;
    }
    if (Math.abs(x2 - x1) > w * 0.62) {
      this.pregnancyConnector = null;
      return;
    }
    const cx = (x1 + x2) / 2;
    const sag = Math.min(14, Math.max(3, Math.abs(x2 - x1) * 0.12));
    const cy = (y1 + y2) / 2 - sag;
    const pathD = `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
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
    const diffWeeks = Math.round(
      (refMonday.getTime() - anchorMonday.getTime()) / (7 * 86400000),
    );
    const idx = Math.max(
      0,
      Math.min(
        this.pregnancyCalWeeksPast + this.pregnancyCalWeeksFuture,
        this.pregnancyCalWeeksPast + diffWeeks,
      ),
    );
    host.scrollLeft = idx * host.clientWidth;
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
    if (clinical <= 13) return 'First trimester';
    if (clinical <= 27) return 'Second trimester';
    return 'Third trimester';
  }

  openPregnancyWatchouts(): void {
    this.router.navigate(['/tabs/insights']);
  }

  getPregnancyInsightsHeading(): string {
    if (!this.pregnancyCalendarViewDate) {
      return 'My daily insights · Today';
    }
    return `My daily insights · ${this.pregnancyCalendarViewDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })}`;
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

  /** Tips list under the cards: omit the first tip when it is already shown on the first card. */
  getPregnancyTipsForDetailBlock(): string[] {
    if (this.pregnancyCalendarViewDate) {
      return this.dashboardPregnancyTips;
    }
    const first = this.dashboardPregnancyTips[0]?.trim();
    const shown = this.getPregnancyPhaseOrInsightLine().trim();
    if (first && shown && first === shown) {
      return this.dashboardPregnancyTips.slice(1);
    }
    return this.dashboardPregnancyTips;
  }

  getPregnancyBabyEmoji(): string {
    if (this.getPregnancyDisplayWeek() > 40) {
      return '✨';
    }
    return this.getBabyEmoji(this.getPregnancyWeekDetailRouteParam());
  }

  openStatusDetails(): void {
    if (this.isPregnant) {
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
    if (!this.pregnancyStartDate) return 'Not set';
    const raw = this.pregnancyStartDate.includes('T')
      ? this.pregnancyStartDate
      : `${this.pregnancyStartDate}T12:00:00`;
    const dueDate = new Date(raw);
    dueDate.setDate(dueDate.getDate() + 280);
    return dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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
