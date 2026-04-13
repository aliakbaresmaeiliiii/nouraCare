import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  ElementRef,
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
import {
  PeriodDatePickerPageComponent,
  PeriodDateRange,
} from '../period-date-picker-page/period-date-picker-page.component';
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
import { MessageService } from '../shared/services/message.service';
import { TrackDataService } from '../shared/services/track-data.service';
import { UserInfoService } from '../shared/services/user-info.service';
import { AuthService } from '../auth/services/auth';
import type { UserInfo } from '../shared/interfaces/user-info-api.interface';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { OnboardingService } from '../shared/services/onboarding.service';
import {
  HomeReproductiveUiService,
  type HomePageJourneyState,
} from './services/home-reproductive-ui.service';
import { HomeJourneyBridgeService } from './services/home-journey-bridge.service';
import { HomeDataService } from './services/home-data.service';
import {
  getBabyDevelopmentFactForWeek,
  getBabyFunFactForWeek,
} from './data/home-baby-week-copy';
import { HOME_POSTPARTUM_WEEK_SAMPLES } from './data/home-postpartum-sample.data';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
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
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private trackDataService = inject(TrackDataService);
  @ViewChild(CirclePeriodChart) periodChart!: CirclePeriodChart;
  @ViewChild('pregnancyCalendarScroll', { read: ElementRef })
  pregnancyCalendarScroll?: ElementRef<HTMLElement>;

  /** Calendar: when set, hero / insights reflect this calendar day (not after today). */
  pregnancyCalendarViewDate: Date | null = null;
  pregnancyCalendarSelectedIsoKey: string | null = null;

  private readonly pregnancyCalWeeksPast = 10;
  private readonly pregnancyCalWeeksFuture = 10;
  /** Matches cycle settings / week-detail usable range. */
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
  periodStartDate: Date | null = null;
  periodLength: number = 5;
  pregnancyWeek: number = 12;
  pregnancyProgress: number = 30; // percentage

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
  pregnancyStartDate: string = '2024-01-01';
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
    }
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

    if (onboardingCompleted === 'true' && onboardingData) {
      try {
        const data = JSON.parse(onboardingData);

        // Update user status based on onboarding data
        if (data.pregnancy_status === 'pregnant') {
          this.userStatus = 'Pregnant';
          this.isPregnant = true;
          this.isPostpartum = false;

          // Set pregnancy week if provided
          if (data.pregnancy_week) {
            this.pregnancyWeek = data.pregnancy_week;
            this.pregnancyProgress = (data.pregnancy_week / 40) * 100;
            this.cycleSettings.setPregnancyWeek(data.pregnancy_week);
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
        if (data.last_period) {
          this.cycleSettings.setLastPeriodStart(data.last_period);
          this.periodStartDate = new Date(data.last_period);
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
    if (state.isPregnant) {
      if (state.pregnancyWeek != null) {
        this.pregnancyWeek = state.pregnancyWeek;
      }
      if (state.pregnancyProgress != null) {
        this.pregnancyProgress = state.pregnancyProgress;
      }
    } else {
      this.pregnancyWeek = this.cycleSettings.pregnancyWeek();
      this.pregnancyProgress = this.cycleSettings.pregnancyProgress();
    }
    this.periodStartDate = state.periodStartDate;
    if (state.cycleDayDirty) {
      this.updateCycleDay();
    }

    if (this.isPregnant) {
      this.clearPregnancyCalendarSelectionIfInvalid();
      this.scheduleScrollPregnancyCalendarToAnchor();
    }
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

  showStartTrackingOnboarding(): boolean {
    return this.homeReproUi.showStartTrackingSection({
      userStatus: this.userStatus,
      isPregnant: this.isPregnant,
      isPostpartum: this.isPostpartum,
    });
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
    this.openDailyTracking();
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
    this.router.navigate(['/week-detail'], {
      queryParams: { week: this.pregnancyWeek },
    });
    this.showToast('Opening week ' + this.pregnancyWeek + ' details...');
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
    const match = all.find((d) => d.week === this.pregnancyWeek);
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

  // Update pregnancy week and recalculate progress
  updatePregnancyWeek(week: number) {
    this.pregnancyWeek = week;
    this.pregnancyProgress = (week / 40) * 100;
    // Baby size data is now automatically computed via getters
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
    return lengths[this.pregnancyWeek] || 'Growing...';
  }

  // Change week navigation
  changeWeek(direction: number) {
    const newWeek = this.pregnancyWeek + direction;
    if (newWeek >= 4 && newWeek <= 40) {
      this.updatePregnancyWeek(newWeek);
      this.showToast(
        `Week ${newWeek}: Your baby is now the size of a ${this.getCurrentBabySize().size.split(' ')[0]}! 🎉`,
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

  // Update pregnancy status
  async updatePregnancyStatus() {
    try {
      // Check if we have last period date from onboarding
      const lastPeriodFromOnboarding = this.cycleSettings.lastPeriodStartDate();

      if (lastPeriodFromOnboarding) {
        // Use onboarding data to automatically calculate pregnancy week
        await this.calculateAndUpdatePregnancyStatus(lastPeriodFromOnboarding);
      } else {
        // Ask for last period date if not available from onboarding
        const lmpAlert = await this.alertController.create({
          header: '🤰 Last Period Date',
          message:
            'Please enter the date of your last menstrual period (LMP) to calculate your current pregnancy week.',
          inputs: [
            {
              name: 'lastPeriod',
              type: 'date',
              placeholder: 'Last menstrual period date',
              label: 'LMP Date',
            },
          ],
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Calculate & Update',
              handler: async (data) => {
                if (data.lastPeriod) {
                  await this.calculateAndUpdatePregnancyStatus(data.lastPeriod);
                } else {
                  this.showToast(
                    'Please enter your last period date',
                    'warning',
                  );
                }
              },
            },
          ],
        });

        await lmpAlert.present();
      }
    } catch (error) {
      console.error('Error in updatePregnancyStatus:', error);
      await this.showToast(
        'Failed to update status. Please try again.',
        'danger',
      );
    }
  }

  // Calculate pregnancy week and update status
  private async calculateAndUpdatePregnancyStatus(lastPeriod: string) {
    try {
      // Calculate pregnancy week based on LMP
      const lmpDate = new Date(lastPeriod);
      const today = new Date();
      const daysDifference = Math.floor(
        (today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const pregnancyWeek = Math.floor(daysDifference / 7) + 1;

      // Validate pregnancy week (should be between 4-40 weeks)
      if (pregnancyWeek < 4 || pregnancyWeek > 40) {
        await this.showToast(
          'Invalid date. Please enter a valid LMP date (4-40 weeks ago).',
          'warning',
        );
        return;
      }

      await new Promise<void>((resolve, reject) => {
        this.onboardingService
          .updateReproductiveState({
            state: 'pregnant',
            pregnancyStartDate: lastPeriod,
            currentWeek: pregnancyWeek,
          })
          .subscribe({ next: () => resolve(), error: () => reject() });
      });

      // Update pregnancy status
      this.userStatus = 'Pregnant';
      this.isPregnant = true;
      this.isPostpartum = false;

      // Update pregnancy week and progress
      this.pregnancyWeek = pregnancyWeek;
      this.pregnancyProgress = (pregnancyWeek / 40) * 100;

      // Save to persistent storage
      this.cycleSettings.setUserStatus('Pregnant');
      this.cycleSettings.setPregnancyStatus(true);
      this.cycleSettings.setPostpartumStatus(false);
      this.cycleSettings.setPregnancyWeek(pregnancyWeek);
      this.cycleSettings.setPregnancyProgress(this.pregnancyProgress);

      // Update onboarding data in localStorage
      this.updateOnboardingData('pregnant', pregnancyWeek);

      // Refresh the display to show pregnancy progress
      this.refreshDisplay();

      // Get current baby size for display
      const currentBaby = this.babyDevelopmentService.getCurrentBabySize();
      const babySizeText = currentBaby ? currentBaby.size : 'Unknown';

      // Show results
      const successAlert = await this.alertController.create({
        header: '🎉 Congratulations!',
        message: `You are currently in week ${pregnancyWeek} of your pregnancy!\n\nYour baby is the size of a ${babySizeText}.\n\nYour pregnancy progress has been updated and you can now track your journey.`,
        buttons: [
          {
            text: 'View Pregnancy Progress',
            handler: () => {
              // Stay on home page to see the pregnancy progress
            },
          },
          {
            text: 'View Pregnancy Guide',
            handler: () => {
              this.router.navigate(['/tabs/tools']);
            },
          },
        ],
      });

      await successAlert.present();
      await this.showToast(
        `Pregnancy week ${pregnancyWeek} calculated successfully!`,
        'success',
      );
    } catch (error) {
      console.error('Error calculating pregnancy week:', error);
      await this.showToast('Failed to calculate pregnancy week', 'danger');
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
      const lmpDate = new Date(lastPeriod);
      const today = new Date();
      const daysDifference = Math.floor(
        (today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const pregnancyWeek = Math.floor(daysDifference / 7);

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

Generated by Muslim Kids App To Elahi Fatat besham Azizam`;

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
    this.cycleSettings.setLastPeriodStart(
      periodRange.startDate.toISOString().split('T')[0],
    );
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

    // Calculate pregnancy progress based on selected date
    const selectedDate = day.fullDate;
    const pregnancyStartDate = new Date(this.pregnancyStartDate);
    const diffTime = Math.abs(
      selectedDate.getTime() - pregnancyStartDate.getTime(),
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.pregnancyDays = diffDays;
    this.pregnancyWeek = Math.floor(diffDays / 7);
    this.pregnancyProgress = (this.pregnancyWeek / 40) * 100;

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
    this.pregnancyWeek = week;
    this.pregnancyProgress = (week / 40) * 100;
    this.pregnancyDays = week * 7;
    this.updateBabySize();

    // Calculate the start date based on selected week
    const today = new Date();
    const daysToSubtract = this.pregnancyDays;
    const startDate = new Date(
      today.getTime() - daysToSubtract * 24 * 60 * 60 * 1000,
    );
    this.pregnancyStartDate = startDate.toISOString().split('T')[0];
  }

  onDateChange(event: any) {
    const selectedDate = new Date(event.detail.value);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - selectedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.pregnancyDays = diffDays;
    this.pregnancyWeek = Math.floor(diffDays / 7);
    this.pregnancyProgress = (this.pregnancyWeek / 40) * 100;

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
      return `You're ${this.pregnancyWeek} weeks pregnant. How are you feeling today?`;
    }
    if (this.userStatus === 'Trying to Conceive') {
      return `Day ${this.currentCycleDay} of your cycle. Let's track your journey together.`;
    }
    if (this.isPostpartum) {
      return 'Welcome to your postpartum journey. Take care of yourself.';
    }
    return "Ready to start your health journey? Let's begin tracking!";
  }

  getStatusIcon(): string {
    if (this.isPregnant) return 'heart';
    if (this.userStatus === 'Trying to Conceive') return 'analytics';
    if (this.isPostpartum) return 'flower';
    return 'calendar';
  }

  getStatusIconClass(): string {
    if (this.isPregnant) return 'pregnant-status';
    if (this.userStatus === 'Trying to Conceive') return 'ttc-status';
    if (this.isPostpartum) return 'postpartum-status';
    return 'default-status';
  }

  getStatusTitle(): string {
    if (this.isPregnant) return `${this.pregnancyWeek} Weeks Pregnant`;
    if (this.userStatus === 'Trying to Conceive') return 'Tracking Fertility';
    if (this.isPostpartum) return 'Postpartum Care';
    return 'Getting Started';
  }

  getStatusDescription(): string {
    if (this.isPregnant) return `Your baby is growing beautifully!`;
    if (this.userStatus === 'Trying to Conceive')
      return `Day ${this.currentCycleDay} of your cycle`;
    if (this.isPostpartum) return 'Focus on recovery and bonding';
    return 'Set up your profile to get started';
  }

  openCurrentPregnancyWeekDetail(): void {
    this.router.navigate(['/week-detail'], {
      queryParams: { week: this.getPregnancyDisplayWeek() },
    });
  }

  /** Week + day shown in hero, week detail, and baby card when user picks a calendar day. */
  getPregnancyDisplayWeek(): number {
    if (!this.isPregnant || !this.pregnancyCalendarViewDate) {
      return this.pregnancyWeek;
    }
    return this.computePregnancyWeekForDate(this.pregnancyCalendarViewDate);
  }

  /**
   * Completed pregnancy weeks for a calendar day vs `pregnancyStartDate`, or `null` if start unknown.
   * Dates before start return `-1`.
   */
  private getPregnancyWeekForCalendarDay(ref: Date): number | null {
    if (!this.pregnancyStartDate) {
      return null;
    }
    const raw = this.pregnancyStartDate.includes('T')
      ? this.pregnancyStartDate
      : `${this.pregnancyStartDate}T12:00:00`;
    const start = new Date(raw);
    const u0 = Date.UTC(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const u1 = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
    if (u1 < u0) {
      return -1;
    }
    const totalDays = Math.floor((u1 - u0) / 86400000) + 1;
    return Math.floor(totalDays / 7);
  }

  private computePregnancyWeekForDate(ref: Date): number {
    const w = this.getPregnancyWeekForCalendarDay(ref);
    if (w === null) {
      return this.pregnancyWeek;
    }
    return Math.max(0, w);
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
  }

  /** Days completed within current week (0–6), aligned with stored pregnancy week when possible. */
  getPregnancyHeroExtraDays(): number {
    const total = this.getTotalPregnancyDaysAlong();
    const w = this.getPregnancyDisplayWeek();
    const extra = total - w * 7;
    if (extra >= 0 && extra <= 6) return extra;
    return total % 7;
  }

  /** 1-based day along pregnancy from start date, or derived from week data. */
  getTotalPregnancyDaysAlong(): number {
    if (this.pregnancyStartDate) {
      const raw = this.pregnancyStartDate.includes('T')
        ? this.pregnancyStartDate
        : `${this.pregnancyStartDate}T12:00:00`;
      const start = new Date(raw);
      const ref = this.pregnancyCalendarViewDate ?? new Date();
      const u0 = Date.UTC(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      );
      let u1 = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
      if (u1 < u0) {
        u1 = u0;
      }
      const diff = Math.floor((u1 - u0) / 86400000);
      return Math.max(1, diff + 1);
    }
    return Math.max(1, this.pregnancyWeek * 7 + (this.pregnancyDays % 7));
  }

  getTrimesterInsightLabel(): string {
    const w = this.getPregnancyDisplayWeek();
    if (w <= 12) return 'First trimester';
    if (w <= 26) return 'Second trimester';
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

  getPregnancyBabyEmoji(): string {
    return this.getBabyEmoji(Math.max(1, this.getPregnancyDisplayWeek()));
  }

  openStatusDetails(): void {
    if (this.isPregnant) {
      this.router.navigate(['/week-detail'], {
        queryParams: { week: this.pregnancyWeek },
      });
    } else if (this.userStatus === 'Trying to Conceive') {
      this.openSymptomsTracking();
    } else {
      this.router.navigate(['/profile']);
    }
  }

  getProgressCircumference(): string {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    return `${circumference} ${circumference}`;
  }

  getProgressOffset(): string {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const progress = (this.pregnancyWeek / 40) * 100;
    const offset = circumference - (progress / 100) * circumference;
    return `${offset}`;
  }

  getDaysRemaining(): number {
    return (40 - this.pregnancyWeek) * 7;
  }

  getDueDate(): string {
    if (!this.pregnancyStartDate) return 'Not set';
    const dueDate = new Date(this.pregnancyStartDate);
    dueDate.setDate(dueDate.getDate() + 40 * 7);
    return dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  getTrimester(): string {
    if (this.pregnancyWeek <= 12) return '1st Trimester';
    if (this.pregnancyWeek <= 26) return '2nd Trimester';
    return '3rd Trimester';
  }

  getMilestone(): string {
    if (this.pregnancyWeek <= 4) return 'Early Development';
    if (this.pregnancyWeek <= 8) return 'Organ Formation';
    if (this.pregnancyWeek <= 12) return 'First Trimester Complete';
    if (this.pregnancyWeek <= 20) return 'Halfway There!';
    if (this.pregnancyWeek <= 28) return 'Third Trimester';
    if (this.pregnancyWeek <= 36) return 'Almost Ready';
    return 'Full Term';
  }

  getProgressPercentage(): number {
    return Math.round((this.pregnancyWeek / 40) * 100);
  }

  viewExpertProfile(): void {
    this.router.navigate(['/tabs/consultation']);
  }

  // UI State Properties
  hasUserAvatar = false;
  hasExpertImage = false;
}
