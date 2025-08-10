import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { ForgetPassword } from './components/forget-password/forget-password';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { ResetPassword } from './components/reset-password/reset-password';
import { Auth } from './services/auth';
import { AuthLayout } from './components/auth-layout/auth-layout';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  // {
  //   path: 'forgot-password',
  //   component: ForgetPassword,
  //   canActivate: [GuestGuard],
  // },
  // {
  //   path: 'reset-password/:token',
  //   component: ResetPassword,
  //   canActivate: [GuestGuard],
  // },
];

@NgModule({
  declarations: [AuthLayout, Login, Register, ForgetPassword, ResetPassword],
  imports: [RouterModule.forChild(routes), SharedModule],
  providers: [
    Auth,

    // SocialAuthService,
    // {
    //   provide: 'SocialAuthServiceConfig',
    //   useValue: {
    //     autoLogin: false,
    //     lang: 'en',
    //     providers: [
    //       {
    //         id: GoogleLoginProvider.PROVIDER_ID,
    //         provider: new GoogleLoginProvider(
    //           '302618903274-6bfd6agmkoanb474m3e1ii3oc1phjl40.apps.googleusercontent.com'
    //         ),
    //       },
    //     ],
    //     onError: (err: any) => {
    //       console.error('❌❌❌', err);
    //     },
    //   } as SocialAuthServiceConfig,
    // },
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  // providers: [{provide:RECAPTCHA_V3_SITE_KEY,useValue:'6LcWrPAqAAAAAGCPuLNhdXoJ7eqaEFSjXCTjrTbn'}],
})
export class AuthModule {}
