import {
  ChangeDetectorRef,
  Component,
  inject,
  Renderer2,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OnboardingDataDto,
  OnboardingService,
} from '../../shared/services/onboarding.service';
import { RegisterRequest } from './model/register-request-interface';
import { AuthService } from '../services/auth';
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
import { PENDING_INVITE_CODE_KEY } from '../../shared/constants/growth.constants';

@Component({  
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  isSocialLoading = false;
  onboardingData = signal<OnboardingDataDto | null>(null);
  onboardingService = inject(OnboardingService);
  activeTab: 'login' | 'register' = 'login';
  fb = inject(FormBuilder);
  message: string = '';
  isLoading: boolean = false;
  accessTokenSubject = new BehaviorSubject<string>('');
  showToast = false;
  success!: boolean;
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
  });

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    // Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]
  });

  router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  renderer = inject(Renderer2);
  cdr = inject(ChangeDetectorRef);
  // matcher = new ErrorStateMatcher();

  service = inject(AuthService);
  private googleSignIn = inject(GoogleSignInService);
  private onboardingStateService = inject(OnboardingService);
  selectedRole: string = '';
  private destroy$ = new Subject<void>();
  successCaptcha = signal<boolean>(false);
  private loginClick$ = new Subject<void>();

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
  // toggleTheme() {
  //   this.themeManager.toggleTheme();
  // }

  setRole(role: string) {
    this.selectedRole = role;
    this.title.set(role);
  }

  refreshToken(): void {
    // this.authService.refreshAuthToken(GoogleLoginProvider.PROVIDER_ID);
  }

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

    this.loginClick$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.loginForm.valid && !this.isLoading),
        tap(() => {
          this.isLoading = true;
          this.cdr.detectChanges();
        }),
        exhaustMap(() => {
          const payload = {
            email: this.loginForm.value.email || '',
            phoneNumber: this.loginForm.value.phoneNumber || '',
          };

          return this.service.login(payload).pipe(
            catchError((err) => {
              this.message =
                err?.error?.message || 'Login failed. Please try again.';
              this.success = false;
              this.showToast = true;
              return EMPTY;
            }),
            finalize(() => {
              this.isLoading = false;
              this.cdr.detectChanges();
            })
          );
        })
      )
      .subscribe({
        next: (res) => {
          this.message = 'Login successful!';
          this.success = true;
          this.showToast = true;

          if (res?.data) {
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

          const isEmailVerified = !!res?.data?.user?.isVerified;
          if (!isEmailVerified) {
            this.router.navigate(['/auth/verify-email']);
          } else {
            this.router.navigate(['/tabs/home']);
          }
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
    this.activeTab = tab;
    if (tab === 'register') {
      this.title.set('Register');
    } else {
      this.title.set('Login');
    }
  }
  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Get onboarding data from localStorage if available
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

    this.isLoading = true;
    this.cdr.detectChanges();

    this.service
      .register(payload, onboardingData)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          localStorage.setItem('userInfo', JSON.stringify(res));

          // Clear onboarding data after successful registration
          if (onboardingData) {
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_completed');
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
          }

          this.router.navigate(['auth/verify-email']);
        },
        error: (err) => {
          console.error('Registration failed:', err);
        },
      });
  }

  onLogin() {
    this.loginClick$.next();
  }

  async onSocialLogin(provider: 'google' | 'apple') {
    if (this.isSocialLoading || this.isLoading) {
      return;
    }

    if (provider === 'google') {
      await this.completeGoogleSocialLogin();
      return;
    }

    const activeForm = this.activeTab === 'login' ? this.loginForm : this.registerForm;
    const formEmail = (activeForm.value.email || '').trim();
    const promptEmail = this.requestAppleEmail();
    const email = (promptEmail || formEmail).trim();

    if (!email || !this.isValidEmail(email)) {
      this.message = 'A valid email is required for social login.';
      this.success = false;
      this.showToast = true;
      return;
    }

    this.isSocialLoading = true;
    this.cdr.detectChanges();

    this.service
      .socialLogin(provider, email)
      .pipe(
        finalize(() => {
          this.isSocialLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.message = 'Apple login successful!';
          this.success = true;
          this.showToast = true;

          if (res?.data?.accessToken) {
            this.service.setUserInfoFromSocialResponse(res);
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
          }

          const isEmailVerified = !!res?.data?.user?.isVerified;
          if (!isEmailVerified) {
            this.router.navigate(['/auth/verify-email']);
          } else {
            this.router.navigate(['/tabs/home']);
          }
        },
        error: (err) => {
          this.message =
            err?.error?.message || 'Apple login is currently unavailable.';
          this.success = false;
          this.showToast = true;
        },
      });
  }

  private async completeGoogleSocialLogin(): Promise<void> {
    this.isSocialLoading = true;
    this.cdr.detectChanges();

    try {
      const { email, fullName } = await this.googleSignIn.signInWithGoogle();
      const res = await firstValueFrom(
        this.service.socialLogin('google', email, fullName),
      );

      this.message = 'Google login successful!';
      this.success = true;
      this.showToast = true;

      if (res?.data?.accessToken) {
        this.service.setUserInfoFromSocialResponse(res);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
      }

      const isEmailVerified = !!res?.data?.user?.isVerified;
      if (!isEmailVerified) {
        this.router.navigate(['/auth/verify-email']);
      } else {
        this.router.navigate(['/tabs/home']);
      }
    } catch (err: unknown) {
      if (err instanceof GoogleSignInNotConfiguredError) {
        this.message =
          'Google Sign-In is not configured. Add your OAuth Web Client ID as googleWebClientId in environments (Google Cloud Console).';
      } else {
        const httpLike = err as { error?: { message?: string } };
        this.message =
          httpLike?.error?.message ||
          (err instanceof Error ? err.message : '') ||
          'Google sign-in was cancelled or is unavailable.';
      }
      this.success = false;
      this.showToast = true;
    } finally {
      this.isSocialLoading = false;
      this.cdr.detectChanges();
    }
  }

  /** Apple sign-in still uses email from the form or a browser prompt as a fallback. */
  private requestAppleEmail(): string {
    const activeForm = this.activeTab === 'login' ? this.loginForm : this.registerForm;
    const existingEmail = (activeForm.value.email || '').trim();
    if (this.isValidEmail(existingEmail)) {
      return existingEmail;
    }

    return (
      window.prompt('Enter your Apple account email:', '') || ''
    ).trim();
  }

  private isValidEmail(email: string): boolean {
    return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  resolved(captchaResponse: any) {
    // console.log(`Captcha resolved with response: ${captchaResponse}`);
    // // Send token to backend for verification
    // this.#authService.verifyCaptcha(captchaResponse).subscribe(res => {
    //   this.successCaptcha.set(res.success);
    //   console.log('from captcha', res);
    // });
  }

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
