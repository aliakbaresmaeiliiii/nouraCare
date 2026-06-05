import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../services/auth';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';
import { TranslationService } from '../../shared/services/translation.service';
import {
  extractApiMessagePayload,
  resolveApiMessage,
} from '../../shared/utils/resolve-api-message.util';

import {
  EMAIL_OTP_LENGTH,
  EMAIL_OTP_VALIDITY_MS,
  EMAIL_VERIFICATION_EXPIRES_KEY,
  EMAIL_VERIFICATION_JUST_SENT_KEY,
} from '../constants/email-verification.constants';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  readonly otpLength = EMAIL_OTP_LENGTH;

  showToast = false;
  message = '';
  success = signal<boolean>(false);
  isLoading = false;
  isResending = false;
  service = inject(AuthService);
  private translation = inject(TranslationService);
  userInfo!: Record<string, unknown>;
  form!: FormGroup;
  /** Seconds until the code expires (server-side window). */
  timer = 0;
  isExpired = false;

  private codeExpiresAt = 0;
  private codeTimerSub?: Subscription;

  get userEmail(): string {
    const data = this.userInfo?.['data'] as Record<string, unknown> | undefined;
    const user = (data?.['user'] ?? this.userInfo?.['user']) as
      | Record<string, unknown>
      | undefined;
    return String(user?.['email'] ?? this.userInfo?.['email'] ?? '');
  }

  get canVerify(): boolean {
    const code = this.normalizeOtpInput(this.form?.get('otpCode')?.value);
    return code.length === EMAIL_OTP_LENGTH && !this.isLoading;
  }

  get canResend(): boolean {
    return !this.isResending;
  }

  get toastOkButton(): string {
    return this.t('common.ok');
  }

  get timerDisplay(): string {
    return this.formatSeconds(this.timer);
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    this.form = this.fb.group({
      otpCode: [
        '',
        [
          Validators.required,
          Validators.minLength(EMAIL_OTP_LENGTH),
          Validators.maxLength(EMAIL_OTP_LENGTH),
        ],
      ],
    });
    this.initCodeExpiry();
    if (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(EMAIL_VERIFICATION_JUST_SENT_KEY) === '1'
    ) {
      sessionStorage.removeItem(EMAIL_VERIFICATION_JUST_SENT_KEY);
    }
  }

  ngOnDestroy(): void {
    this.clearCodeTimer();
  }

  private initCodeExpiry(): void {
    const stored = localStorage.getItem(EMAIL_VERIFICATION_EXPIRES_KEY);
    const parsed = stored ? Number.parseInt(stored, 10) : Number.NaN;

    if (Number.isFinite(parsed) && parsed > Date.now()) {
      this.codeExpiresAt = parsed;
    } else if (!Number.isFinite(parsed)) {
      this.codeExpiresAt = Date.now() + EMAIL_OTP_VALIDITY_MS;
      localStorage.setItem(
        EMAIL_VERIFICATION_EXPIRES_KEY,
        String(this.codeExpiresAt),
      );
    } else {
      this.codeExpiresAt = Date.now() + EMAIL_OTP_VALIDITY_MS;
      localStorage.setItem(
        EMAIL_VERIFICATION_EXPIRES_KEY,
        String(this.codeExpiresAt),
      );
    }

    this.syncExpiryState();
    this.clearCodeTimer();
    this.codeTimerSub = interval(1000).subscribe(() => this.syncExpiryState());
  }

  private syncExpiryState(): void {
    const remainingMs = this.codeExpiresAt - Date.now();
    this.timer = Math.max(0, Math.ceil(remainingMs / 1000));
    this.isExpired = remainingMs <= 0;
  }

  private clearCodeTimer(): void {
    this.codeTimerSub?.unsubscribe();
    this.codeTimerSub = undefined;
  }

  private formatSeconds(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  onOtpChange(event: { detail: { value?: string | number | null } }): void {
    const otp = this.normalizeOtpInput(event.detail.value);
    this.form.patchValue({ otpCode: otp });
    if (otp.length === EMAIL_OTP_LENGTH && !this.isLoading) {
      queueMicrotask(() => this.verifyOtp(otp));
    }
  }

  verifyOtp(otp: string): void {
    const code = this.normalizeOtpInput(otp);
    if (code.length !== EMAIL_OTP_LENGTH) {
      return;
    }

    if (this.isExpired) {
      this.showToast = true;
      this.message = this.t('auth.toast.codeExpiredResend');
      this.success.set(false);
      return;
    }

    const email = this.userEmail;
    if (!email) {
      this.showToast = true;
      this.message = this.t('auth.toast.emailNotFound');
      this.success.set(false);
      return;
    }

    this.isLoading = true;
    this.service
      .verifyEmail({ email, code })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res: {
          code?: number;
          message?: string;
          messageKey?: string;
          data?: { code?: string; accessToken?: string; messageKey?: string };
        }) => {
          if (
            res.code === 200 ||
            res.data?.code === '200' ||
            res.data?.accessToken
          ) {
            if (res.data?.accessToken) {
              this.service.setUserInfoFromSocialResponse(res as never);
              localStorage.setItem('userInfo', JSON.stringify(res.data));
            }
            localStorage.removeItem(EMAIL_VERIFICATION_EXPIRES_KEY);
            this.showToast = true;
            this.message = resolveApiMessage(this.translation, {
              messageKey: res.messageKey ?? res.data?.messageKey,
              message: (res as { message?: string }).message,
              fallbackKey: 'auth.api.emailVerified',
            });
            this.success.set(true);
            this.router.navigate(['/tabs/home']);
            return;
          }

          this.showToast = true;
          this.message = this.t('auth.toast.invalidCode');
          this.success.set(false);
        },
        error: (error: { error?: { message?: string; messageKey?: string } }) => {
          this.showToast = true;
          this.message = resolveApiMessage(this.translation, {
            ...extractApiMessagePayload(error),
            fallbackKey: 'auth.toast.verifyFailed',
          });
          this.success.set(false);
        },
      });
  }

  onSubmit(): void {
    if (!this.canVerify) {
      this.form.markAllAsTouched();
      return;
    }
    const otp = this.normalizeOtpInput(this.form.get('otpCode')?.value);
    if (otp) {
      this.verifyOtp(otp);
    }
  }

  private normalizeOtpInput(value: unknown): string {
    return String(value ?? '').replace(/\D/g, '').slice(0, EMAIL_OTP_LENGTH);
  }

  resendCode(): void {
    if (!this.canResend) {
      return;
    }

    const email = this.userEmail;
    if (!email) {
      this.showToast = true;
      this.message = this.t('auth.toast.emailNotFound');
      this.success.set(false);
      return;
    }

    this.isResending = true;
    this.service
      .resendOtp({ email })
      .pipe(finalize(() => (this.isResending = false)))
      .subscribe({
        next: (res: { message?: string; messageKey?: string; data?: { messageKey?: string } }) => {
          this.codeExpiresAt = Date.now() + EMAIL_OTP_VALIDITY_MS;
          localStorage.setItem(
            EMAIL_VERIFICATION_EXPIRES_KEY,
            String(this.codeExpiresAt),
          );
          this.syncExpiryState();
          this.form.patchValue({ otpCode: '' });
          this.showToast = true;
          this.message = resolveApiMessage(this.translation, {
            messageKey: res.messageKey ?? res.data?.messageKey,
            message: res.message,
            fallbackKey: 'auth.api.verificationCodeSent',
          });
          this.success.set(true);
        },
        error: (error: { error?: { message?: string; messageKey?: string } }) => {
          this.showToast = true;
          this.message = resolveApiMessage(this.translation, {
            ...extractApiMessagePayload(error),
            fallbackKey: 'auth.toast.resendFailed',
          });
          this.success.set(false);
        },
      });
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
