import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewDidEnter } from '@ionic/angular';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInputOtp,
  IonSpinner,
  IonToast,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  callOutline,
  logoApple,
  logoGoogle,
  mailOpenOutline,
  mailOutline,
  moonOutline,
  shieldCheckmarkOutline,
  sunnyOutline,
  timeOutline,
} from 'ionicons/icons';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  exhaustMap,
  filter,
  finalize,
  firstValueFrom,
  interval,
  map,
  merge,
  startWith,
  takeUntil,
  tap,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { PENDING_INVITE_CODE_KEY } from '../../shared/constants/growth.constants';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DashboardCacheService } from '../../shared/services/dashboard-cache.service';
import { LANGUAGE_SWITCHING_ENABLED } from '../../shared/services/language.service';
import {
  OnboardingDataDto,
  OnboardingService,
} from '../../shared/services/onboarding.service';
import {
  ThemePreference,
  ThemeService,
} from '../../shared/services/theme.service';
import { TranslationService } from '../../shared/services/translation.service';
import {
  extractApiMessagePayload,
  resolveApiMessage,
} from '../../shared/utils/resolve-api-message.util';
import {
  mapLocalOnboardingToReproductiveInit,
  type LocalOnboardingAnswers,
} from '../../shared/utils/onboarding-reproductive.util';
import {
  EMAIL_OTP_LENGTH,
  EMAIL_OTP_VALIDITY_MS,
  SMS_OTP_VALIDITY_MS,
  markEmailVerificationSent,
} from '../constants/email-verification.constants';
import { TokenResponse } from '../models/token.interface';
import {
  AppleSignInNotConfiguredError,
  AppleSignInService,
} from '../services/apple-sign-in.service';
import { AuthService } from '../services/auth';
import {
  GoogleSignInNotConfiguredError,
  GoogleSignInService,
} from '../services/google-sign-in.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInputOtp,
    IonSpinner,
    IonToast,
    AppButtonComponent,
    LanguageSwitcherComponent,
    TranslatePipe,
  ],
  styleUrl: './login.component.scss',
  host: {
    '[class.login--backgrounded]': 'isBackgrounded()',
  },
})
export class LoginComponent
  implements OnInit, OnDestroy, ViewDidEnter, AfterViewInit
{
  readonly otpLength = EMAIL_OTP_LENGTH;
  readonly appleSignInEnabled = environment.appleSignInEnabled;
  readonly emailOtpEnabled = environment.emailOtpEnabled === true;
  readonly languageSwitchingEnabled = LANGUAGE_SWITCHING_ENABLED;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly googleSignIn = inject(GoogleSignInService);
  private readonly appleSignIn = inject(AppleSignInService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly dashboardCache = inject(DashboardCacheService);
  private readonly translation = inject(TranslationService);
  private readonly themeService = inject(ThemeService);

  readonly loginForm = this.fb.group({
    email: [''],
    phoneNumber: [''],
    otp: ['', [Validators.minLength(6), Validators.maxLength(6)]],
  });

  /** Which identifier the user is signing in with. */
  readonly loginMethod = signal<'email' | 'phone'>('email');

  readonly isDarkTheme = signal(false);
  readonly titlePaintActive = signal(false);
  readonly isBackgrounded = signal(false);
  readonly isSocialLoading = signal(false);
  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly toastSuccess = signal(false);
  readonly toastButtons = signal<string[]>(['OK']);
  readonly loginOtpStep = signal(false);
  readonly isResendingLoginOtp = signal(false);
  /** Seconds remaining until the login OTP expires. */
  readonly loginOtpTimerSec = signal(0);
  readonly loginOtpExpired = signal(false);

  private readonly authActionInProgress = signal<'login' | null>(null);
  private titlePaintTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly loginClick$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();
  private loginOtpTimerSub?: Subscription;
  private loginOtpExpiresAt = 0;

  private readonly loginFormView = toSignal(
    merge(this.loginForm.valueChanges, this.loginForm.statusChanges).pipe(
      startWith(null),
      map(() => this.readLoginFormView()),
    ),
    { initialValue: this.readLoginFormView() },
  );

  readonly isLoginLoading = computed(
    () => this.authActionInProgress() === 'login',
  );

  readonly isAuthBusy = computed(
    () =>
      this.authActionInProgress() !== null ||
      this.isSocialLoading() ||
      this.isResendingLoginOtp(),
  );

  readonly canResendLoginOtp = computed(
    () => !this.isResendingLoginOtp() && !this.isLoginLoading(),
  );

  readonly loginDisabled = computed(() => {
    if (this.isAuthBusy() && !this.isLoginLoading()) {
      return true;
    }
    const form = this.loginFormView();
    const method = this.loginMethod();
    if (!this.loginOtpStep()) {
      return method === 'email' ? form.emailInvalid : form.phoneInvalid;
    }
    return form.otpIncomplete || this.loginOtpExpired();
  });

  readonly loginOtpTimerDisplay = computed(() =>
    this.formatOtpSeconds(this.loginOtpTimerSec()),
  );

  readonly emailShowError = computed(() => {
    const form = this.loginFormView();
    return (
      this.loginMethod() === 'email' &&
      form.emailTouched &&
      form.emailInvalid
    );
  });

  readonly phoneShowError = computed(() => {
    const form = this.loginFormView();
    return (
      this.loginMethod() === 'phone' &&
      form.phoneTouched &&
      form.phoneInvalid
    );
  });

  readonly loginOtpSentMessage = computed(() => {
    if (this.loginMethod() === 'phone') {
      const phone = this.loginFormView().phoneNumber;
      return this.translation.translateParams('auth.otpSentToPhone', {
        phone,
      });
    }
    const email = this.loginFormView().email;
    return this.translation.translateParams('auth.otpSentTo', { email });
  });

  readonly continueButtonLabelKey = computed(() => {
    if (this.isLoginLoading()) {
      return 'auth.signingIn';
    }
    if (this.loginOtpStep()) {
      return 'auth.verifyCode';
    }
    return this.loginMethod() === 'phone'
      ? 'auth.continueWithPhone'
      : 'auth.continueWithEmail';
  });

  constructor() {
    addIcons({
      moonOutline,
      sunnyOutline,
      mailOutline,
      callOutline,
      alertCircleOutline,
      mailOpenOutline,
      logoGoogle,
      logoApple,
      shieldCheckmarkOutline,
      timeOutline,
    });

    this.bindPageVisibility();
  }

  ngOnInit(): void {
    this.syncThemeFromService();
    this.applyLoginMethodValidators(this.loginMethod());
    this.themeService.appearanceChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncThemeFromService());

    this.activatedRoute.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const ref = (params['ref'] || params['invite'] || '').trim();
        if (ref && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(PENDING_INVITE_CODE_KEY, ref.toUpperCase());
        }
      });

    const devEmail = environment.devAuthEmail?.trim();
    if (!environment.production && devEmail) {
      this.loginForm.patchValue({ email: devEmail });
    }

    this.loginClick$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.canSubmitLogin()),
        tap(() => this.authActionInProgress.set('login')),
        exhaustMap(() => {
          const method = this.loginMethod();
          const email = (this.loginForm.value.email || '').trim();
          const phoneNumber = this.normalizePhoneInput(
            this.loginForm.value.phoneNumber,
          );
          const otp = this.normalizeOtpInput(this.loginForm.value.otp);
          const identifier =
            method === 'phone'
              ? { phoneNumber: phoneNumber! }
              : { email };

          const authRequest$: Observable<TokenResponse> =
            this.loginOtpStep() && otp
              ? this.auth.verifyOtp({ ...identifier, otp })
              : this.auth.requestOtp(identifier);

          return authRequest$.pipe(
            catchError((err) => {
              this.presentToast(
                resolveApiMessage(this.translation, {
                  ...extractApiMessagePayload(err),
                  fallbackKey: 'auth.toast.loginFailed',
                }),
                false,
              );
              return EMPTY;
            }),
            finalize(() => {
              if (this.authActionInProgress() === 'login') {
                this.authActionInProgress.set(null);
              }
            }),
          );
        }),
      )
      .subscribe({
        next: (res) => {
          if (
            !res?.data?.accessToken &&
            (res?.data?.otpSent || res?.data?.requiresVerification)
          ) {
            this.enterLoginOtpStep();
            this.presentToast(
              resolveApiMessage(this.translation, {
                messageKey: res.messageKey ?? res.data?.messageKey,
                message: res.message,
                fallbackKey: 'auth.api.otpSentIfExists',
              }),
              true,
            );
            return;
          }

          if (!res?.data?.accessToken) {
            this.presentToast(
              resolveApiMessage(this.translation, {
                messageKey: res?.messageKey ?? res?.data?.messageKey,
                message: res?.message,
                fallbackKey: 'auth.toast.loginFailed',
              }),
              false,
            );
            return;
          }

          this.presentToast(this.t('auth.toast.loginSuccess'), true);

          if (res?.data?.user) {
            this.auth.setUserInfo({
              id: res.data.user.id,
              email: res.data.user.email,
              phone: res.data.user.phone ?? '',
              name: res.data.user['name'],
              profileImage: res.data.user['profileImage'],
              isVerified: res.data.user.isVerified,
              status: res.data.user['status'],
              city: res.data.user['city'],
              birthday: res.data.user['birthday'],
              createdAt: res.data.user['createdAt'],
            });
          }

          void this.finishAuthNavigationToHome();
        },
      });
  }

  setTheme(preference: Extract<ThemePreference, 'light' | 'dark'>): void {
    if (
      (preference === 'dark' && this.isDarkTheme()) ||
      (preference === 'light' && !this.isDarkTheme())
    ) {
      return;
    }
    this.themeService.setPreference(preference);
  }

  setLoginMethod(method: 'email' | 'phone'): void {
    if (this.loginMethod() === method || this.loginOtpStep()) {
      return;
    }
    this.loginMethod.set(method);
    this.applyLoginMethodValidators(method);
    this.loginForm.patchValue({ otp: '' });
    this.loginForm.markAsUntouched();
  }

  resetLoginOtpStep(): void {
    this.clearLoginOtpTimer();
    this.loginOtpStep.set(false);
    this.loginOtpExpired.set(false);
    this.loginOtpTimerSec.set(0);
    this.loginForm.patchValue({ otp: '' });
  }

  resendLoginOtp(): void {
    if (!this.canResendLoginOtp()) {
      return;
    }

    const method = this.loginMethod();
    const email = (this.loginForm.get('email')?.value || '').trim();
    const phoneNumber = this.normalizePhoneInput(
      this.loginForm.get('phoneNumber')?.value,
    );

    if (method === 'email' && !this.isValidEmail(email)) {
      return;
    }
    if (method === 'phone' && !phoneNumber) {
      return;
    }

    this.isResendingLoginOtp.set(true);

    const resend$ = this.auth.requestOtp(
      method === 'phone' ? { phoneNumber: phoneNumber! } : { email },
    );

    resend$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isResendingLoginOtp.set(false)),
      )
      .subscribe({
        next: (res) => {
          const otpSent =
            res?.data?.otpSent === true || !!res?.messageKey;
          if (otpSent) {
            this.loginForm.patchValue({ otp: '' });
            this.startLoginOtpTimer();
            this.presentToast(
              resolveApiMessage(this.translation, {
                messageKey: res?.messageKey ?? res?.data?.messageKey,
                message: res?.message,
                fallbackKey: 'auth.api.otpSentIfExists',
              }),
              true,
            );
          }
        },
        error: (err) => {
          this.presentToast(
            resolveApiMessage(this.translation, {
              ...extractApiMessagePayload(err),
              fallbackKey: 'auth.toast.resendFailed',
            }),
            false,
          );
        },
      });
  }

  onLogin(event?: Event): void {
    event?.preventDefault();
    if (!this.canSubmitLogin()) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loginClick$.next();
  }

  onLoginOtpChange(event: {
    detail: { value?: string | number | null };
  }): void {
    const otp = this.normalizeOtpInput(event.detail.value);
    this.loginForm.patchValue({ otp });
    if (
      otp.length === EMAIL_OTP_LENGTH &&
      this.loginOtpStep() &&
      !this.loginOtpExpired() &&
      !this.isLoginLoading()
    ) {
      queueMicrotask(() => this.onLogin());
    }
  }

  async onSocialLogin(provider: 'google' | 'apple'): Promise<void> {
    if (this.isAuthBusy()) {
      return;
    }

    if (provider === 'google') {
      await this.completeGoogleSocialLogin();
      return;
    }

    if (!this.appleSignInEnabled) {
      return;
    }

    await this.completeAppleSocialLogin();
  }

  onToastDismiss(): void {
    this.showToast.set(false);
  }

  viewLicenseAgreement(event: Event): void {
    event.preventDefault();
    void this.router.navigate(['/terms']);
  }

  ionViewDidEnter(): void {
    this.scheduleTitlePaint();
  }

  ngAfterViewInit(): void {
    this.scheduleTitlePaint();
  }

  ngOnDestroy(): void {
    if (this.titlePaintTimer !== null) {
      window.clearTimeout(this.titlePaintTimer);
    }
    this.clearLoginOtpTimer();
    this.destroy$.next();
    this.destroy$.complete();
    this.loginClick$.complete();
  }

  private enterLoginOtpStep(): void {
    this.loginOtpStep.set(true);
    this.startLoginOtpTimer();
    if (this.loginMethod() === 'email') {
      this.persistEmailForVerification(
        (this.loginForm.value.email || '').trim(),
      );
    }
    queueMicrotask(() => this.focusLoginOtp());
  }

  private startLoginOtpTimer(): void {
    const validityMs =
      this.loginMethod() === 'phone'
        ? SMS_OTP_VALIDITY_MS
        : EMAIL_OTP_VALIDITY_MS;
    this.loginOtpExpiresAt = Date.now() + validityMs;
    this.syncLoginOtpExpiry();
    this.clearLoginOtpTimer();
    this.loginOtpTimerSub = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncLoginOtpExpiry());
  }

  private syncLoginOtpExpiry(): void {
    const remainingMs = this.loginOtpExpiresAt - Date.now();
    this.loginOtpTimerSec.set(Math.max(0, Math.ceil(remainingMs / 1000)));
    this.loginOtpExpired.set(remainingMs <= 0);
  }

  private clearLoginOtpTimer(): void {
    this.loginOtpTimerSub?.unsubscribe();
    this.loginOtpTimerSub = undefined;
  }

  private formatOtpSeconds(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private focusLoginOtp(): void {
    const host = document.getElementById('login-otp') as
      | (HTMLElement & { setFocus?: () => Promise<void> })
      | null;
    if (!host) {
      return;
    }
    if (typeof host.setFocus === 'function') {
      void host.setFocus();
      return;
    }
    host.focus();
  }

  private finishSocialLogin(res: {
    data?: { accessToken?: string; user?: { isVerified?: boolean } };
  }): void {
    this.presentToast(this.t('auth.toast.loginSuccess'), true);

    if (res?.data?.accessToken) {
      this.auth.setUserInfoFromSocialResponse(res as TokenResponse);
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
    }

    if (this.emailOtpEnabled && !res?.data?.user?.isVerified) {
      markEmailVerificationSent();
      void this.router.navigate(['/auth/verify-email']);
      return;
    }

    void this.router.navigate(['/tabs/home']);
  }

  private async completeAppleSocialLogin(): Promise<void> {
    this.isSocialLoading.set(true);

    try {
      const { email, fullName, idToken } =
        await this.appleSignIn.signInWithApple();
      const res = await firstValueFrom(
        this.auth.socialLogin('apple', { email, fullName, idToken }),
      );
      this.finishSocialLogin(res);
    } catch (err: unknown) {
      if (err instanceof AppleSignInNotConfiguredError) {
        this.presentToast(this.t('auth.toast.appleNotConfigured'), false);
      } else {
        const httpLike = err as { error?: { message?: string } };
        this.presentToast(
          resolveApiMessage(this.translation, {
            ...extractApiMessagePayload(err),
            message:
              httpLike?.error?.message ||
              (err instanceof Error ? err.message : undefined),
            fallbackKey: 'auth.toast.appleUnavailable',
          }),
          false,
        );
      }
    } finally {
      this.isSocialLoading.set(false);
    }
  }

  private async completeGoogleSocialLogin(): Promise<void> {
    this.isSocialLoading.set(true);

    try {
      const { email, fullName, idToken, accessToken } =
        await this.googleSignIn.signInWithGoogle();
      const res = await firstValueFrom(
        this.auth.socialLogin('google', {
          email,
          fullName,
          idToken,
          accessToken,
        }),
      );
      this.finishSocialLogin(res);
    } catch (err: unknown) {
      if (err instanceof GoogleSignInNotConfiguredError) {
        this.presentToast(this.t('auth.toast.googleNotConfigured'), false);
      } else {
        const httpLike = err as { error?: { message?: string } };
        this.presentToast(
          resolveApiMessage(this.translation, {
            ...extractApiMessagePayload(err),
            message:
              httpLike?.error?.message ||
              (err instanceof Error ? err.message : undefined),
            fallbackKey: 'auth.toast.googleUnavailable',
          }),
          false,
        );
      }
    } finally {
      this.isSocialLoading.set(false);
    }
  }

  private async finishAuthNavigationToHome(): Promise<void> {
    const local = this.readStoredOnboardingData() as LocalOnboardingAnswers | null;
    const payload = mapLocalOnboardingToReproductiveInit(local);
    if (payload && this.auth.getAccessToken()) {
      try {
        await firstValueFrom(
          this.onboardingService.initializeReproductiveState(payload),
        );
        this.dashboardCache.invalidate();
      } catch {
        /* Server registration may already have initialized; Home can still reconcile. */
      }
    }
    this.clearStoredOnboardingAfterAuth();
    await this.router.navigate(['/tabs/home']);
  }

  private canSubmitLogin(): boolean {
    if (this.authActionInProgress() !== null || this.isSocialLoading()) {
      return false;
    }
    const method = this.loginMethod();
    const emailValid = !!this.loginForm.get('email')?.valid;
    const phoneValid = !!this.loginForm.get('phoneNumber')?.valid;
    if (!this.loginOtpStep()) {
      return method === 'email' ? emailValid : phoneValid;
    }
    if (this.loginOtpExpired()) {
      return false;
    }
    const otp = this.normalizeOtpInput(this.loginForm.get('otp')?.value);
    return otp.length === EMAIL_OTP_LENGTH;
  }

  private applyLoginMethodValidators(method: 'email' | 'phone'): void {
    const emailCtrl = this.loginForm.get('email');
    const phoneCtrl = this.loginForm.get('phoneNumber');
    if (method === 'email') {
      emailCtrl?.setValidators([Validators.required, Validators.email]);
      phoneCtrl?.clearValidators();
      phoneCtrl?.setValue('');
    } else {
      phoneCtrl?.setValidators([
        Validators.required,
        Validators.pattern(/^(\+98|0)?9\d{9}$/),
      ]);
      emailCtrl?.clearValidators();
      emailCtrl?.setValue('');
    }
    emailCtrl?.updateValueAndValidity({ emitEvent: false });
    phoneCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private readLoginFormView(): {
    email: string;
    emailInvalid: boolean;
    emailTouched: boolean;
    phoneNumber: string;
    phoneInvalid: boolean;
    phoneTouched: boolean;
    otp: string;
    otpIncomplete: boolean;
  } {
    const emailCtrl = this.loginForm.get('email');
    const phoneCtrl = this.loginForm.get('phoneNumber');
    const otp = this.normalizeOtpInput(this.loginForm.get('otp')?.value);
    return {
      email: (emailCtrl?.value || '').trim(),
      emailInvalid: !!emailCtrl?.invalid,
      emailTouched: !!emailCtrl?.touched,
      phoneNumber: this.normalizePhoneInput(phoneCtrl?.value) || '',
      phoneInvalid: !!phoneCtrl?.invalid,
      phoneTouched: !!phoneCtrl?.touched,
      otp,
      otpIncomplete: otp.length < EMAIL_OTP_LENGTH,
    };
  }

  private presentToast(message: string, success: boolean): void {
    this.toastMessage.set(message);
    this.toastSuccess.set(success);
    this.toastButtons.set([this.t('common.ok')]);
    this.showToast.set(true);
  }

  private persistEmailForVerification(email: string): void {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    try {
      localStorage.setItem(
        'userInfo',
        JSON.stringify({ data: { user: { email: normalized } } }),
      );
    } catch {
      /* ignore quota / private mode */
    }
  }

  private readStoredOnboardingData(): OnboardingDataDto | null {
    try {
      const storedData = localStorage.getItem('onboarding_data');
      if (storedData) {
        return JSON.parse(storedData) as OnboardingDataDto;
      }
    } catch (error) {
      console.error('Error parsing onboarding data:', error);
    }
    return null;
  }

  private clearStoredOnboardingAfterAuth(): void {
    if (localStorage.getItem('onboarding_data')) {
      localStorage.removeItem('onboarding_data');
      localStorage.removeItem('onboarding_completed');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
    }
  }

  private normalizeOtpInput(value: unknown): string {
    return String(value ?? '')
      .replace(/\D/g, '')
      .slice(0, EMAIL_OTP_LENGTH);
  }

  /** Normalize Iranian mobiles to 09xxxxxxxxx for the API. */
  private normalizePhoneInput(value: unknown): string | undefined {
    const raw = String(value ?? '').replace(/[\s\-()]/g, '');
    if (!raw) return undefined;
    let digits = raw;
    if (digits.startsWith('+98')) digits = `0${digits.slice(3)}`;
    else if (digits.startsWith('98')) digits = `0${digits.slice(2)}`;
    else if (digits.startsWith('9') && digits.length === 10) digits = `0${digits}`;
    if (!/^09\d{9}$/.test(digits)) return raw;
    return digits;
  }

  private isValidEmail(email: string): boolean {
    return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private scheduleTitlePaint(): void {
    if (this.titlePaintTimer !== null) {
      window.clearTimeout(this.titlePaintTimer);
    }

    this.titlePaintActive.set(false);
    this.titlePaintTimer = window.setTimeout(() => {
      this.titlePaintActive.set(true);
      this.titlePaintTimer = null;
    }, 120);
  }

  private syncThemeFromService(): void {
    this.isDarkTheme.set(this.themeService.effectiveIsDark());
  }

  private bindPageVisibility(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const sync = () => this.isBackgrounded.set(document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', sync);
    });
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
