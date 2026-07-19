import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  otp = '';
  step = signal<'email' | 'otp'>('email');
  loading = signal(false);
  error = signal('');

  submitEmail(): void {
    this.error.set('');
    const email = this.email.trim().toLowerCase();
    if (!email) {
      this.error.set('Email is required');
      return;
    }
    this.loading.set(true);
    this.auth.requestOtp(email).subscribe({
      next: (data) => {
        this.loading.set(false);
        try {
          const user = this.auth.completeIfTokens(data as any);
          if (user) {
            void this.router.navigateByUrl('/');
            return;
          }
        } catch (e) {
          this.error.set(e instanceof Error ? e.message : 'Admin access required');
          this.auth.logout();
          return;
        }
        this.step.set('otp');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.message || err?.error?.message || 'Could not start sign-in',
        );
      },
    });
  }

  submitOtp(): void {
    this.error.set('');
    if (!this.otp.trim()) {
      this.error.set('Enter the code from your email');
      return;
    }
    this.loading.set(true);
    this.auth.verifyOtp(this.email.trim().toLowerCase(), this.otp.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.message || err?.error?.message || 'Invalid code or not an admin',
        );
      },
    });
  }

  back(): void {
    this.step.set('email');
    this.otp = '';
    this.error.set('');
  }
}
