import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  interval,
  Subscription
} from 'rxjs';

import { AuthService } from '../services/auth';
import { OnboardingStateService } from '@app/shared/services/onboarding-state.service';
import { SharedModule } from '@app/shared/shared-module';

function otpRequiredLength(length: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || value.toString().length !== length) {
      return { otpLength: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  standalone: true,
  imports: [SharedModule],
})
export class VerifyEmailComponent implements OnInit {
  showToast = false;
  message = '';
  success = signal<boolean>(false);
  otpCode: string = '';
  isLoading: boolean = false;
  service = inject(AuthService);
  userInfo!: any;
  form!: FormGroup;
  timer: number = 180;
  timerSub!: Subscription;
  isExpired: boolean = false;

  constructor(
    private fb: FormBuilder,
    private httpClient: HttpClient,
    private router: Router
  ) { }

  private onboardingStateService = inject(OnboardingStateService);

  ngOnInit() {
    this.userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    this.form = this.fb.group({
      otpCode: ['', [Validators.required, Validators.minLength(4)]],
    });
    this.startTimer();
  }

  startTimer() {
    this.timer = 180;
    this.isExpired = false;

    this.timerSub = interval(1000).subscribe(() => {
      this.timer--;
      if (this.timer <= 0) {
        this.isExpired = true;
        this.timerSub.unsubscribe();
      }
    });
  }

  onOtpChange(event: any) {
    const otp = event.detail.value;
    if (otp && otp.length === 4) {
      this.verifyOrp(otp);
    }
  }

  getValidationText(controlName: string): string {
    const control = this.form.get('otpCode');
    if (!control) return '';

    if (control.valid && control.value) {
      return 'Valid';
    } else if (control.invalid && control.touched) {
      return 'Invalid';
    }
    return '';
  }

  async verifyOrp(otp: string) {
    if (this.isExpired) {
      this.showToast = true;
      this.message = 'OTP expired,Please request a new one';
      this.success.set(false);
      return;
    }
    const payload = {
      email: this.userInfo.data.user.email,
      code: otp,
    };
    this.service.verifyEmail(payload).subscribe({
      next: (res: any) => {
        console.log('Response:', res);
        // Now we can rely on the interceptor to provide consistent success flag
        if (res.code === 200 || res.data.code == '200') {
          this.showToast = true;
          this.message = 'Email verified successfully!';
          this.success.set(true);
           this.router.navigate(['/tabs/home']);
        } else {
          this.showToast = true;
          this.message = 'Invalid OTP, please try again.';
          this.success.set(false);
        }
      },
      error: (error) => {
        console.log(error);

        this.showToast = true;
        this.message = error.error.message;
      },
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const otp = this.form.get('otpCode')?.value;
      if (otp) {
        this.verifyOrp(otp);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  resendCode() {
    this.startTimer();
    const email = this.userInfo.data.email;
    const payload = {
      email: email,
    };
    this.service.resendOtp(payload).subscribe((res) => {
      console.log('newCOde', res);
      // Check if user has completed onboarding
      if (this.onboardingStateService.hasCompletedOnboarding()) {
        this.router.navigate(['/tabs/home']);
      } else {
        this.router.navigate(['/onboarding']);
      }
    });
  }
}
