import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Renderer2,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../services/auth';
import { RegisterRequest } from './model/register-request-interface';
import {
  OnboardingDataDto,
  OnboardingService,
} from '@app/shared/services/onboarding.service';
import { SharedModule } from '@app/shared/shared-module';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, SharedModule],
  styleUrl: './login.component.scss',
  providers: [AuthService],
})
export class LoginComponent {
  onboardingData = signal<OnboardingDataDto | null>(null);
  onboardingService = inject(OnboardingService);
  activeTab: 'login' | 'register' = 'login';
  fb = inject(FormBuilder);
  message: string = '';
  isLoading: boolean = false;
  showToast = false;
  success!: boolean;
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    // Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]
  });

  router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  renderer = inject(Renderer2);
  cdr = inject(ChangeDetectorRef);
  // matcher = new ErrorStateMatcher();

  service = inject(AuthService);
  private onboardingStateService = inject(OnboardingService);
  selectedRole: string = '';
  private destroy$ = new Subject<void>();
  successCaptcha = signal<boolean>(false);

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
    });
    const sessionId = this.onboardingService.getSessionId();
    if (sessionId) {
      this.loadOnboardingData(sessionId);
    }
  }

  private loadOnboardingData(sessionId: string): void {
    this.onboardingStateService.getOnboardingData(sessionId).subscribe({
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
    let onboardingData = null;
    try {
      const storedData = localStorage.getItem('onboarding_data');
      if (storedData) {
        onboardingData = JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Error parsing onboarding data:', error);
    }

    const payload: RegisterRequest = {
      email: this.registerForm.value.email,
      phone: this.registerForm.value.phone,
    };

    this.service.register(payload, onboardingData).subscribe({
      next: (res) => {
        localStorage.setItem('userInfo', JSON.stringify(res));

        // Clear onboarding data after successful registration
        if (onboardingData) {
          localStorage.removeItem('onboarding_data');
          localStorage.removeItem('onboarding_completed');
        }

        this.router.navigate(['auth/verify-email']);
      },
      error: (err) => {
        console.error('Registration failed:', err);
      },
    });
  }

  onLogin() {
    if (this.loginForm.value) {
      // if (this.loginForm.invalid) {
      //   this.message = 'Please enter a valid email.';
      //   this.success = false;
      //   this.showToast = true;
      //   return;
      // }
      const payload = {
        email: this.loginForm.value.email || '',
        phone: this.loginForm.value.phone || '',
      };
      this.service.login(payload).subscribe({
        next: (res: any) => {
          this.message = 'Login successful!';
          this.success = true;
          this.showToast = true;

          // Store user info using AuthService (which handles token storage)
          if (res?.data) {
            this.service.setUserInfo(res.data.user);
            // Also store the full response data for compatibility
            localStorage.setItem('userInfo', JSON.stringify(res.data));
          }

          // Check if email is verified
          const isEmailVerified = res?.data.user.isVerified;

          if (!isEmailVerified) {
            // Email not verified, redirect to verify-email page
            console.log('Email not verified, redirecting to verify-email page');
            this.router.navigate(['/auth/verify-email']);
          } else {
            // Navigate to home page
            this.router.navigate(['/tabs/home']);
          }

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.message =
            err?.error?.message || 'Login failed. Please try again.';
          this.success = false;
          this.showToast = true;
          this.cdr.detectChanges();
        },
        complete: () => {},
      });
    }
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
