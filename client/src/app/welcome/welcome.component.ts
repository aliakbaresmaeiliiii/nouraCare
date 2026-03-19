import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  NavController
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { RegisterRequest } from '../auth/login/model/register-request-interface';
import { AuthService } from '../auth/services/auth';
import { LanguageService } from '../shared/services/language.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('loginSection', { static: false }) loginSection!: ElementRef;
  activeTab: 'login' | 'register' = 'login';
  private navCtrl: NavController = inject(NavController);
  private languageSubscription!: Subscription;
  // Form groups
  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private languageService: LanguageService,
    private router: Router,
  ) {
    // Initialize login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      // password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Initialize register form
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        phone: [
          '',
          [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]{10,15}$/)],
        ],
        // password: ['', [Validators.required, Validators.minLength(6)]],
        // confirmPassword: ['', [Validators.required]]
      },
      // { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    // Listen to language changes to trigger updates
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(
      () => {
        // This will trigger change detection when language changes
      },
    );
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    console.log('Welcome component view initialized');
    console.log('Login section element:', this.loginSection);
    if (this.loginSection) {
      console.log('Login section found in ngAfterViewInit');
    } else {
      console.log('Login section NOT found in ngAfterViewInit');
    }
  }

  // Password match validator
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      confirmPassword?.setErrors(null);
      return null;
    }
  }

  // Form submission methods
  onLogin() {
    if (this.loginForm.valid) {
      console.log('Login form submitted:', this.loginForm.value);
      this.authService.login(this.loginForm.value).subscribe((res) => {
        console.log('Login response:', res);
        localStorage.setItem('userInfo', JSON.stringify(res));

        // Navigate directly to main app after successful login
        console.log('Navigating to tabs');
        this.navCtrl.navigateRoot('tabs');
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const payload: RegisterRequest = {
      email: this.registerForm.value.email,
      phoneNumber: this.registerForm.value.phoneNumber,
    };
    // this.authService.register(payload).subscribe({
    //   next: (res) => {

    //     this.router.navigate(['verify-email']);
    //   },
    //   error: (err) => {
    //     console.error('Registration failed:', err);
    //   },
    // });
  }
  // Helper methods for validation
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength'])
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return 'Please enter a valid phone number';
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
  }

  scrollToLogin() {
    console.log('Scroll to login clicked'); // Debug log
    console.log('Login section reference:', this.loginSection);

    if (this.loginSection && this.loginSection.nativeElement) {
      console.log('Login section found, scrolling...'); // Debug log
      this.loginSection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      console.log('Login section not found'); // Debug log
      // Try to find it manually
      const loginSection = document.querySelector('.login-section');
      console.log('Manual search for login section:', loginSection);
      if (loginSection) {
        loginSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  }

  testOnboarding() {
    this.router.navigate(['/onboarding']).then(
      (success) => console.log('Navigation successful:', success),
      (error) => console.error('Navigation failed:', error),
    );
  }
}
