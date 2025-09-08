import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Renderer2,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { OnboardingStateService } from 'src/app/shared/services/onboarding-state.service';
import { SharedModule } from 'src/app/shared/shared-module';
import { AuthService } from '../services/auth';
import { RegisterRequest } from './model/register-request-interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    CommonModule, 
    SharedModule,
  
  ],
  styleUrl: './login.component.scss',
  providers: [AuthService],
})
export class LoginComponent {
  activeTab: 'login' | 'register' = 'login';
  fb = inject(FormBuilder);
  message: string = '';
  isLoading: boolean = false;
  private navCtrl: NavController = inject(NavController);
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
  renderer = inject(Renderer2);
  cdr = inject(ChangeDetectorRef);
  // matcher = new ErrorStateMatcher();

  service = inject(AuthService);
  private onboardingStateService = inject(OnboardingStateService);
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

  ngOnInit(): void {}

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
    const payload: RegisterRequest = {
      email: this.registerForm.value.email,
      phone: this.registerForm.value.phone,
    };
    this.service.register(payload).subscribe({
      next: (res) => {
        localStorage.setItem('userInfo', JSON.stringify(res));

        this.router.navigate(['verify-email']);
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
        next: (res) => {
          localStorage.setItem('userInfo', JSON.stringify(res));
          this.message = 'Login successful!';
          this.success = true;
          this.showToast = true;
          
          // Check if user has completed onboarding
            this.router.navigate(['/tabs/home']);
          
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

    // if (this.form.value) {
    //   let formValue = this.form.value;
    //   this.#authService.login(formValue).subscribe({
    //     next: (res: any) => {
    //       // this.permissionService.setPermissions(res.data.permissions);
    //       this.storeDataUser = res;
    //       const dataJson = JSON.stringify(this.storeDataUser);
    //       console.log(res);
    //       localStorage.setItem('userData', dataJson);
    //       if (res.code === 200) {
    //         // this.toast.success('login is successfully');
    //         this.router.navigate(['/dashboard']);
    //       }
    //     },
    //     error: (e) => {
    //       if (e) {
    //         this.router.navigate(['auth/confirm-email']);
    //         this.storeDataUser;
    //         const email = localStorage.getItem('emailClinic');
    //         if (email) {
    //           // this.#authService.fetchConfirmCode(email).subscribe(res => {
    //           //   if (res) {
    //           //     this.router.navigate(['/dashboard']);
    //           //   }
    //           // });
    //         }
    //       }
    //     },
    //   });
    // }
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
    this.router.navigate(['auth/register']);
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
