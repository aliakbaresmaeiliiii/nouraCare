import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  Renderer2,
  signal,
} from '@angular/core';
import { ViewDidEnter } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OnboardingDataDto,
  OnboardingService,
} from '../../shared/services/onboarding.service';
import { RegisterRequest } from './model/register-request-interface';
import { LoginRequest } from './model/login-request-interface';
import { AuthService } from '../services/auth';
import {
  EMAIL_OTP_LENGTH,
  markEmailVerificationSent,
} from '../constants/email-verification.constants';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  catchError,
  exhaustMap,
  filter,
  finalize,
  firstValueFrom,
  takeUntil,
  tap,
} from 'rxjs';
import {
  GoogleSignInNotConfiguredError,
  GoogleSignInService,
} from '../services/google-sign-in.service';
import {
  AppleSignInNotConfiguredError,
  AppleSignInService,
} from '../services/apple-sign-in.service';
import { PENDING_INVITE_CODE_KEY } from '../../shared/constants/growth.constants';
import { TranslationService } from '../../shared/services/translation.service';
import { environment } from '../../../environments/environment';
import {
  extractApiMessagePayload,
  resolveApiMessage,
} from '../../shared/utils/resolve-api-message.util';

@Component({  
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy, ViewDidEnter, AfterViewInit {
  readonly otpLength = EMAIL_OTP_LENGTH;
  readonly appleSignInEnabled = environment.appleSignInEnabled;

  /** Drives title color sweep once the login page is visible. */
  titlePaintActive = false;
  private titlePaintTimer: ReturnType<typeof setTimeout> | null = null;

  isSocialLoading = false;
  onboardingData = signal<OnboardingDataDto | null>(null);
  onboardingService = inject(OnboardingService);
  activeTab: 'login' | 'register' = 'login';
  fb = inject(FormBuilder);
  message: string = '';
  /** Only one auth action may show loading at a time (login vs register vs social). */
  private authActionInProgress: 'login' | 'register' | null = null;
  accessTokenSubject = new BehaviorSubject<string>('');
  showToast = false;
  success!: boolean;
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    otp: ['', [Validators.minLength(6), Validators.maxLength(6)]],
  });

  /** After email submit, user enters the code sent to their inbox. */
  loginOtpStep = false;
  isResendingLoginOtp = false;

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
  });

  router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  renderer = inject(Renderer2);
  cdr = inject(ChangeDetectorRef);

  service = inject(AuthService);
  private googleSignIn = inject(GoogleSignInService);
  private appleSignIn = inject(AppleSignInService);
  private onboardingStateService = inject(OnboardingService);
  private translation = inject(TranslationService);
  selectedRole: string = '';
  private destroy$ = new Subject<void>();
  successCaptcha = signal<boolean>(false);
  private loginClick$ = new Subject<void>();
  private registerClick$ = new Subject<void>();

  get isLoginLoading(): boolean {
    return this.authActionInProgress === 'login';
  }

  get isRegisterLoading(): boolean {
    return this.authActionInProgress === 'register';
  }

  get isAuthBusy(): boolean {
    return (
      this.authActionInProgress !== null ||
      this.isSocialLoading ||
      this.isResendingLoginOtp
    );
  }

  labelEmail = 'Email';
  labelPassword = 'Password';
  form!: FormGroup;
  role!: string;
  // user!: SocialUser;
  loggedIn!: boolean;
  protected wobbleField = false;
  // theme = this.themeManager.theme;
  title = signal<string>('');
  storeDataUser: any;

  get toastOkButton(): string {
    return this.t('common.ok');
  }

  setRole(role: string) {
    this.selectedRole = role;
    this.title.set(role);
  }

  refreshToken(): void {}

  ngOnInit(): void {
    // Check for query parameters to determine active tab
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['tab'] === 'register') {
        this.activeTab = 'register';
        this.title.set('Register');
      }
      const ref = (params['ref'] || params['invite'] || '').trim();
      if (ref && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(PENDING_INVITE_CODE_KEY, ref.toUpperCase());
      }
    });
    const sessionId = this.onboardingService.getSessionId();
    if (sessionId) {
      this.loadOnboardingData(sessionId);
    }

    const devEmail = environment.devAuthEmail?.trim();
    if (!environment.production && devEmail) {
      this.loginForm.patchValue({ email: devEmail });
      this.registerForm.patchValue({ email: devEmail });
    }

    this.loginClick$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.canSubmitLogin()),
        tap(() => {
          this.authActionInProgress = 'login';
          this.cdr.detectChanges();
        }),
        exhaustMap(() => {
          const payload: LoginRequest = {
            email: this.loginForm.value.email || '',
            phoneNumber: this.loginForm.value.phoneNumber || '',
          };
          const otp = this.normalizeOtpInput(this.loginForm.value.otp);
          if (this.loginOtpStep && otp) {
            payload.otp = otp;
          }

          return this.service.login(payload).pipe(
            catchError((err) => {
              const payload = extractApiMessagePayload(err);
              if (
                payload.messageKey === 'auth.api.emailNotVerified' ||
                payload.message ===
                  'Email is not verified. Please complete email verification first.'
              ) {
                this.persistEmailForVerification(
                  this.loginForm.value.email || '',
                );
                markEmailVerificationSent();
                void this.router.navigate(['/auth/verify-email']);
                return EMPTY;
              }

              this.message = resolveApiMessage(this.translation, {
                ...payload,
                fallbackKey: 'auth.toast.loginFailed',
              });
              this.success = false;
              this.showToast = true;
              return EMPTY;
            }),
            finalize(() => {
              if (this.authActionInProgress === 'login') {
                this.authActionInProgress = null;
              }
              this.cdr.detectChanges();
            })
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (res?.data?.otpSent && !res?.data?.accessToken) {
            this.loginOtpStep = true;
            this.message = resolveApiMessage(this.translation, {
              messageKey: res.messageKey ?? res.data?.messageKey,
              message: res.message,
              fallbackKey: 'auth.api.otpSentIfExists',
            });
            this.success = true;
            this.showToast = true;
            return;
          }

          this.message = this.t('auth.toast.loginSuccess');
          this.success = true;
          this.showToast = true;

          if (res?.data?.user) {
            this.service.setUserInfo({
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

            localStorage.setItem('userInfo', JSON.stringify(res.data));
          }

          this.router.navigate(['/tabs/home']);
        },
      });

    this.registerClick$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.canSubmitRegister()),
        tap(() => {
          this.authActionInProgress = 'register';
          this.cdr.detectChanges();
        }),
        exhaustMap(() => {
          let onboardingData: OnboardingDataDto | null = null;
          try {
            const storedData = localStorage.getItem('onboarding_data');
            if (storedData) {
              onboardingData = JSON.parse(storedData) as OnboardingDataDto;
            }
          } catch (error) {
            console.error('Error parsing onboarding data:', error);
          }

          const payload: RegisterRequest = {
            email: this.registerForm.value.email,
            phoneNumber: this.registerForm.value.phoneNumber,
          };

          return this.service.register(payload, onboardingData).pipe(
            catchError((err) => {
              console.error('Registration failed:', err);
              this.message = resolveApiMessage(this.translation, {
                ...extractApiMessagePayload(err),
                fallbackKey: 'auth.api.failedSendVerificationEmail',
              });
              this.success = false;
              this.showToast = true;
              return EMPTY;
            }),
            finalize(() => {
              if (this.authActionInProgress === 'register') {
                this.authActionInProgress = null;
              }
              this.cdr.detectChanges();
            }),
          );
        }),
      )
      .subscribe({
        next: (res) => {
          let onboardingData: OnboardingDataDto | null = null;
          try {
            const storedData = localStorage.getItem('onboarding_data');
            if (storedData) {
              onboardingData = JSON.parse(storedData) as OnboardingDataDto;
            }
          } catch {
            onboardingData = null;
          }

          localStorage.setItem('userInfo', JSON.stringify(res?.data ?? res));

          if (onboardingData) {
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_completed');
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
          }

          markEmailVerificationSent();
          this.router.navigate(['auth/verify-email']);
        },
      });
  }

  private loadOnboardingData(sessionId: string): void {
    this.onboardingService.getOnboardingData(sessionId).subscribe({
      next: (res) => {
        this.onboardingData.set(res.data);
        console.log('Onboarding data loaded:', res);
      },
      error: (err) => {
        console.error('Error loading onboarding data:', err);
      },
    });
  }
  private decodeToken(token: any) {
    return JSON.parse(atob(token.split('.')[1]));
  }
  onTabChange(tab: 'login' | 'register') {
    if (this.isAuthBusy || this.activeTab === tab) {
      return;
    }

    this.activeTab = tab;
    this.resetLoginOtpStep();
    this.title.set(tab === 'register' ? 'Register' : 'Login');
  }

  resetLoginOtpStep(): void {
    this.loginOtpStep = false;
    this.loginForm.patchValue({ otp: '' });
  }

  get canResendLoginOtp(): boolean {
    return !this.isResendingLoginOtp && !this.isLoginLoading;
  }

  resendLoginOtp(): void {
    if (!this.canResendLoginOtp) {
      return;
    }

    const email = (this.loginForm.get('email')?.value || '').trim();
    if (!this.isValidEmail(email)) {
      return;
    }

    this.isResendingLoginOtp = true;
    this.cdr.detectChanges();
    this.service
      .login({ email, phoneNumber: this.loginForm.value.phoneNumber || '' })
      .pipe(
        finalize(() => {
          this.isResendingLoginOtp = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.data?.otpSent) {
            this.loginForm.patchValue({ otp: '' });
            this.message = resolveApiMessage(this.translation, {
              messageKey: res.messageKey ?? res.data?.messageKey,
              message: res.message,
              fallbackKey: 'auth.api.otpSentIfExists',
            });
            this.success = true;
            this.showToast = true;
          }
        },
        error: (err) => {
          this.message = resolveApiMessage(this.translation, {
            ...extractApiMessagePayload(err),
            fallbackKey: 'auth.toast.resendFailed',
          });
          this.success = false;
          this.showToast = true;
        },
      });
  }

  private persistEmailForVerification(email: string): void {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    localStorage.setItem(
      'userInfo',
      JSON.stringify({ data: { user: { email: normalized } } }),
    );
  }

  onRegister(event?: Event) {
    event?.preventDefault();
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.registerClick$.next();
  }

  onLogin(event?: Event) {
    event?.preventDefault();
    this.loginClick$.next();
  }

  private canSubmitRegister(): boolean {
    if (this.authActionInProgress !== null || this.isSocialLoading) {
      return false;
    }
    return this.registerForm.valid;
  }

  onLoginOtpChange(event: { detail: { value?: string | number | null } }): void {
    const otp = this.normalizeOtpInput(event.detail.value);
    this.loginForm.patchValue({ otp });
    if (
      otp.length === EMAIL_OTP_LENGTH &&
      this.loginOtpStep &&
      !this.isLoginLoading
    ) {
      queueMicrotask(() => this.onLogin());
    }
  }

  isLoginDisabled(): boolean {
    if (this.isAuthBusy && !this.isLoginLoading) {
      return true;
    }
    const emailInvalid = !!this.loginForm.get('email')?.invalid;
    if (!this.loginOtpStep) {
      return emailInvalid;
    }
    const otp = this.normalizeOtpInput(this.loginForm.get('otp')?.value);
    return emailInvalid || otp.length < EMAIL_OTP_LENGTH;
  }

  private canSubmitLogin(): boolean {
    if (this.authActionInProgress !== null || this.isSocialLoading) {
      return false;
    }
    const emailValid = !!this.loginForm.get('email')?.valid;
    if (!this.loginOtpStep) {
      return emailValid;
    }
    const otp = this.normalizeOtpInput(this.loginForm.get('otp')?.value);
    return emailValid && otp.length === EMAIL_OTP_LENGTH;
  }

  private normalizeOtpInput(value: unknown): string {
    return String(value ?? '').replace(/\D/g, '').slice(0, EMAIL_OTP_LENGTH);
  }

  async onSocialLogin(provider: 'google' | 'apple') {
    if (this.isAuthBusy) {
      return;
    }

    if (provider === 'google') {
      await this.completeGoogleSocialLogin();
      return;
    }

    await this.completeAppleSocialLogin();
  }

  private finishSocialLogin(res: {
    data?: { accessToken?: string; user?: { isVerified?: boolean } };
  }): void {
    this.message = this.t('auth.toast.loginSuccess');
    this.success = true;
    this.showToast = true;

    if (res?.data?.accessToken) {
      this.service.setUserInfoFromSocialResponse(res as any);
    }

    if (res?.data) {
      localStorage.setItem('userInfo', JSON.stringify(res.data));
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
    }

    if (!res?.data?.user?.isVerified) {
      markEmailVerificationSent();
      this.router.navigate(['/auth/verify-email']);
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }

  private async completeAppleSocialLogin(): Promise<void> {
    this.isSocialLoading = true;
    this.cdr.detectChanges();

    try {
      const { email, fullName, idToken } =
        await this.appleSignIn.signInWithApple();
      const res = await firstValueFrom(
        this.service.socialLogin('apple', { email, fullName, idToken }),
      );
      this.finishSocialLogin(res);
    } catch (err: unknown) {
      if (err instanceof AppleSignInNotConfiguredError) {
        this.message = this.t('auth.toast.appleNotConfigured');
      } else {
        const httpLike = err as { error?: { message?: string } };
        this.message = resolveApiMessage(this.translation, {
          ...extractApiMessagePayload(err),
          message:
            httpLike?.error?.message ||
            (err instanceof Error ? err.message : undefined),
          fallbackKey: 'auth.toast.appleUnavailable',
        });
      }
      this.success = false;
      this.showToast = true;
    } finally {
      this.isSocialLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async completeGoogleSocialLogin(): Promise<void> {
    this.isSocialLoading = true;
    this.cdr.detectChanges();

    try {
      const { email, fullName, idToken, accessToken } =
        await this.googleSignIn.signInWithGoogle();
      const res = await firstValueFrom(
        this.service.socialLogin('google', {
          email,
          fullName,
          idToken,
          accessToken,
        }),
      );

      this.finishSocialLogin(res);
    } catch (err: unknown) {
      if (err instanceof GoogleSignInNotConfiguredError) {
        this.message = this.t('auth.toast.googleNotConfigured');
      } else {
        const httpLike = err as { error?: { message?: string } };
        this.message = resolveApiMessage(this.translation, {
          ...extractApiMessagePayload(err),
          message:
            httpLike?.error?.message ||
            (err instanceof Error ? err.message : undefined),
          fallbackKey: 'auth.toast.googleUnavailable',
        });
      }
      this.success = false;
      this.showToast = true;
    } finally {
      this.isSocialLoading = false;
      this.cdr.detectChanges();
    }
  }

  private isValidEmail(email: string): boolean {
    return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  resolved(_captchaResponse: any) {}

  navigateRegister() {
    this.router.navigate(['/auth/register']);
  }

  onAdminRol(data: string) {
    this.role = data;
  }
  onDoctorRol(data: string) {}
  onPatientRol(data: string) {}
  // Get Value Form For Validation
  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }

  ionViewDidEnter(): void {
    this.scheduleTitlePaint();
  }

  ngAfterViewInit(): void {
    // Fallback when Ionic lifecycle does not fire (web refresh, cached route).
    this.scheduleTitlePaint();
  }

  private scheduleTitlePaint(): void {
    if (this.titlePaintTimer !== null) {
      window.clearTimeout(this.titlePaintTimer);
    }

    this.titlePaintActive = false;
    this.cdr.detectChanges();

    this.titlePaintTimer = window.setTimeout(() => {
      this.titlePaintActive = true;
      this.titlePaintTimer = null;
      this.cdr.detectChanges();
    }, 120);
  }

  ngOnDestroy(): void {
    if (this.titlePaintTimer !== null) {
      window.clearTimeout(this.titlePaintTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  viewLicenseAgreement(event: Event): void {
    event.preventDefault();
    void this.router.navigate(['/terms']);
  }

  get loginOtpSentMessage(): string {
    const email = (this.loginForm.get('email')?.value || '').trim();
    return this.translation.translateParams('auth.otpSentTo', { email });
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
