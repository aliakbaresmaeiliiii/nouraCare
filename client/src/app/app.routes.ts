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
      // {
      //   path: 'library',
      //   loadComponent: () => import('./library/library.component').then(m => m.LibraryComponent),
      // },
      // {
      //   path: 'search',
      //   loadComponent: () => import('./search/search.component').then(m => m.SearchComponent),س
      // },
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
