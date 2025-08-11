import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from 'express';
import { Auth } from '../../services/auth';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { UserInfo } from '../../model/uesr-interface';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail {
  authService = inject(Auth);
  // authService = inject(Auth);
  // // #toastrService = inject(ToastrService);
  // matcher = new ErrorStateMatcher();
  // userData: any;
  userInfo!: any;
  form!: FormGroup;
  // #router = inject(Router);
  otp!: string;
  showOtpComponent = true;
  // selectedRole: string = '';
  config = {
    allowNumbersOnly: false,
    length: 4,
    isPasswordInput: false,
    disableAutoFocus: true,
    inputStyles: {
      width: '50px',
      height: '50px',
    },
  };

  ngOnInit(): void {
    if (localStorage !== undefined) {
      this.userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}').email;
      debugger;
    }
    this.form = new FormGroup({
      verify_code: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
      ]),
    });
  }

  onOtpChange(otp: any) {
    this.otp = otp;
    if (this.otp.length === this.config.length) {
      this.onSubmit();
    }
  }

  onSubmit() {
    const payload = {
      email: this.userInfo || '',
      verify_code: this.otp,
    };
    this.authService
      .verifyEmail(payload)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => this.authService.verifyEmail(payload))
      )
      .subscribe({
        next: (response) => {
          console.log('Email verified successfully:', response);
        },
        error: (error) => {
          console.error('Error verifying email:', error);
        },
      });
  }

  // }
  // onOtpChange(otp: any) {
  //   this.otp = otp;

  //   if (this.otp.length === this.config.length) {
  //     this.onSubmit();
  //   }
  // }

  // loginSuccess() {
  //   localStorage.setItem('isAuthenticated', 'true'); // Set login flag
  //   this.#router.navigate(['aliakbar']).then(() => {
  //     window.history.replaceState({}, '', 'aliakbar'); // Remove previous history
  //   });
  // }
  // onSubmit() {
  //   const payload = {
  //     email: this.userData,
  //     verify_code: this.otp,
  //   };

  // }

  getOtp() {
    // this.#userService.getOTP(this.userData).subscribe(res => {});
  }
  // get verify_code() {
  //   return this.form.get('verify_code');
  // }
}
