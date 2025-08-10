import { Component, inject, Renderer2, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: false,
  styleUrl: './login.scss',
})
export class Login {
  router = inject(Router);
  // #authService = inject(Auth);
  // permissionService = inject(PermissionService);
  // recaptchaV3Service = inject(ReCaptchaV3Service);
  renderer = inject(Renderer2);
  matcher = new ErrorStateMatcher();
  // private themeManager = inject(ThemeManagerService);
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

  createForm() {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      remmeber: new FormControl(false),
    });
  }
  setRole(role: string) {
    this.selectedRole = role;
    this.title.set(role);
  }

  refreshToken(): void {
    // this.authService.refreshAuthToken(GoogleLoginProvider.PROVIDER_ID);
  }

  ngOnInit(): void {
    // this.recaptchaV3Service.execute('homepage').subscribe(token => {
    //   console.log('reCAPTCHA token:', token);
    // });
    // this.setRole('clinic');

    this.createForm();

    // google.accounts.id.initialize({
    //   client_id:
    //     '940657570058-gpm7buu1t25nlls0pcbs95c6t2bf4rg4.apps.googleusercontent.com',
    //   callback: (resp: any) => {
    //     this.handleLogin(resp);
    //   },
    // });
    // google.accounts.id.renderButton(document.getElementById('google-btn'), {
    //   theme: 'filled_blue',
    //   size: 'large',
    //   shape: 'rectangle',
    // });
  }

  private decodeToken(token: any) {
    return JSON.parse(atob(token.split('.')[1]));
  }

  handleLogin(response: any) {
    if (response && response.credential) {
      // Decode the token
      const payload = this.decodeToken(response.credential);
      // Store in session
      sessionStorage.setItem('loggedInUser', JSON.stringify(payload));

      // Navigate to home
      this.router.navigate(['dashboard']);
    } else {
      console.error('Invalid response or missing credential');
    }
  }

  login() {
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
