import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';

export const routes: Routes = [
  {
    path: 'onboarding',
    loadComponent: () => {
      return import('./onboarding/onboarding.component').then((m) => {
        return m.OnboardingComponent;
      });
    },
  },
  {
    path: 'test-onboarding',
    loadComponent: () =>
      import('./onboarding/onboarding.component').then((m) => m.OnboardingComponent),
  },
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
    path: 'blocked-users',
    loadComponent: () =>
      import('./blocked-users/blocked-users.component').then(
        (m) => m.BlockedUsersComponent
      ),
  },
  {
    path: 'check-version',
    loadComponent: () =>
      import('./check-version/check-version.component').then(
        (m) => m.CheckVersionComponent
      ),
  },
  {
    path: 'saved-information',
    loadComponent: () =>
      import('./saved-information/saved-information.component').then(
        (m) => m.SavedInformationComponent
      ),
  },
  {
    path: 'my-friends',
    loadComponent: () =>
      import('./my-friends/my-friends.component').then(
        (m) => m.MyFriendsComponent
      ),
  },
  {
    path: 'forums',
    loadComponent: () =>
      import('./forums/forums.component').then(
        (m) => m.ForumsComponent
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
  },
  {
    path: 'invite-friends',
    loadComponent: () =>
      import('./invite-friends/invite-friends.component').then(
        (m) => m.InviteFriendsComponent
      ),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./notifications/notifications.component').then(
        (m) => m.NotificationsComponent
      ),
  },
  {
    path: 'chatbot',
    loadComponent: () =>
      import('./chatbot/chatbot.component').then(
        (m) => m.ChatbotComponent
      ),
  },
  {
    path: 'period-date-picker',
    loadComponent: () =>
      import('./period-date-picker-page/period-date-picker-page.component').then(
        (m) => m.PeriodDatePickerPageComponent
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
    path: 'week-detail',
    loadComponent: () =>
      import('./week-detail/week-detail.component').then(
        (m) => m.WeekDetailComponent
      ),
  },
  {
    path: 'symptoms-tracker',
    loadComponent: () =>
      import('./symptoms-tracker/symptoms-tracker.component').then(
        (m) => m.SymptomsTrackerComponent
      ),
  },
  {
    path: 'symptoms-detail',
    loadComponent: () =>
      import('./symptoms-detail/symptoms-detail.component').then(
        (m) => m.SymptomsDetailComponent
      ),
  },
  {
    path: 'symptoms-history',
    loadComponent: () =>
      import('./symptoms-history/symptoms-history.component').then(
        (m) => m.SymptomsHistoryComponent
      ),
  },
  {
    path: 'doctors',
    loadComponent: () =>
      import('./doctors/doctors.component').then(
        (m) => m.DoctorsComponent
      ),
  },
  {
    path: 'doctor/:id',
    loadComponent: () =>
      import('./doctor-profile/doctor-profile.component').then(
        (m) => m.DoctorProfileComponent
      ),
  },
  {
    path: 'my-favorites',
    loadComponent: () =>
      import('./my-favorites/my-favorites.component').then(
        (m) => m.MyFavoritesComponent
      ),
  },
  {
    path: 'article/:id',
    loadComponent: () =>
      import('./article-detail/article-detail.component').then(
        (m) => m.ArticleDetailComponent
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
        path: 'insights',
        loadComponent: () =>
          import('./insights/insights.component').then((m) => m.InsightsComponent),
      },
      {
        path: 'SecretChats',
        loadComponent: () =>
          import('./secret-chats/secret-chats').then((m) => m.SecretChatsComponent),
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
        path: 'about',
        loadComponent: () =>
          import('./about/about.component').then((m) => m.AboutComponent),
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
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
];
