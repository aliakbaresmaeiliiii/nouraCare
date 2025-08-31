import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () =>
      import('./welcome/welcome.component').then((m) => m.WelcomeComponent),
  },

  {
    path: 'sign-in',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'verify-email',
    loadComponent: () =>
      import('./auth/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'profile-edit',
    loadComponent: () =>
      import('./edit-profile/edit-profile.component').then(
        (m) => m.EditProfileComponent
      ),
  },
  {
    path: 'period-edit',
    loadComponent: () =>
      import('./edit-period/edit-period.component').then(
        (m) => m.EditPeriodComponent
      ),
  },
  {
    path: 'tabs',
    component: LayoutComponent,
    // loadComponent: () =>
    //   import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'tools',
        loadComponent: () =>
          import('./tools/tools.component').then((m) => m.ToolsComponent),
      },
      {
        path: 'social',
        loadComponent: () =>
          import('./social/social.component').then((m) => m.SocialComponent),
      },
      {
        path: 'consultation',
        loadComponent: () =>
          import('./consultation/consultation.component').then((m) => m.ConsultationComponent),
      },
      {
        path: 'school',
        loadComponent: () =>
          import('./school/school.component').then((m) => m.SchoolComponent),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },

  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
];
