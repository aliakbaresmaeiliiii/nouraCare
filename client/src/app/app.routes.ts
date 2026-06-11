import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { welcomeToSignInRedirectGuard } from './guards/welcome-to-sign-in.guard';
import { LayoutComponent } from './layout/layout.component';
import { ReactWrapperComponent } from './react-wrapper/react-wrapper.component';
import { TOOL_PAGE_ROUTES } from './tool-pages/tool-pages.routes';

export const routes: Routes = [
  {
    path: 'pregnancy',
    component: ReactWrapperComponent,
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./onboarding/onboarding.component').then((m) => {
        return m.OnboardingComponent;
      }),
  },
  {
    path: 'test-onboarding',
    redirectTo: '/onboarding',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    canActivate: [welcomeToSignInRedirectGuard],
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'auth',
    children: [
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
    ],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'edit-profile',
    loadComponent: () =>
      import('./edit-profile/edit-profile.component').then(
        (m) => m.EditProfileComponent
      ),
    canActivate: [authGuard],
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
      import('./forums/forums.component').then((m) => m.ForumsComponent),
  },
  {
    path: 'forums/topic/:id',
    loadComponent: () =>
      import('./forums/topic-detail/topic-detail.component').then(
        (m) => m.TopicDetailComponent
      ),
  },
  {
    path: 'forums/create-post',
    loadComponent: () =>
      import('./forums/create-post/create-post.component').then(
        (m) => m.CreatePostComponent
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'privacy-settings',
    loadComponent: () =>
      import('./settings/privacy-settings/privacy-settings.component').then(
        (m) => m.PrivacySettingsComponent,
      ),
  },
  {
    path: 'data-usage',
    loadComponent: () =>
      import('./settings/data-usage/data-usage.component').then(
        (m) => m.DataUsageComponent,
      ),
  },
  {
    path: 'help-support',
    loadComponent: () =>
      import('./settings/settings-help/settings-help.component').then(
        (m) => m.SettingsHelpComponent,
      ),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./settings/settings-legal-page/settings-legal-page.component').then(
        (m) => m.SettingsLegalPageComponent,
      ),
    data: {
      titleKey: 'settings.privacyPolicy.title',
      subtitleKey: 'settings.privacyPolicy.subtitle',
      bodyKey: 'settings.privacyPolicy.body',
      showEffectiveDate: true,
      heroIcon: 'shield-checkmark',
      documentType: 'privacy',
      contactEmail: 'support@dorehealth.app',
      contactTextKey: 'settings.legal.privacyContactText',
    },
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./settings/settings-legal-page/settings-legal-page.component').then(
        (m) => m.SettingsLegalPageComponent,
      ),
    data: {
      titleKey: 'settings.terms.title',
      subtitleKey: 'settings.terms.subtitle',
      bodyKey: 'settings.terms.body',
      showEffectiveDate: true,
      heroIcon: 'document-text',
      documentType: 'terms',
      contactEmail: 'support@dorehealth.app',
      contactTextKey: 'settings.legal.termsContactText',
    },
  },
  {
    path: 'dorehealth-pro',
    loadComponent: () =>
      import('./dorehealth-pro/dorehealth-pro.component').then(
        (m) => m.DorehealthProComponent,
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
      import('./chatbot/chatbot.component').then((m) => m.ChatbotComponent),
  },
  {
    path: 'period-date-picker',
    loadComponent: () =>
      import(
        './period-date-picker-page/period-date-picker-page.component'
      ).then((m) => m.PeriodDatePickerPageComponent),
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
      import('./2/week-detail.component').then((m) => m.WeekDetailComponent),
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
    path: 'doctors/category/:categoryId',
    loadComponent: () =>
      import('./doctors/doctors.component').then((m) => m.DoctorsComponent),
  },
  {
    path: 'doctors',
    loadComponent: () =>
      import('./doctors/doctors.component').then((m) => m.DoctorsComponent),
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
    path: 'payment',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./payment/payment-page/payment-page.component').then(
            (m) => m.PaymentPageComponent,
          ),
      },
      {
        path: 'result',
        loadComponent: () =>
          import('./payment/payment-result/payment-result.component').then(
            (m) => m.PaymentResultComponent,
          ),
      },
    ],
  },
  {
    path: 'shop',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./shop/shop.component').then((m) => m.ShopComponent),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./shop/shop-cart/shop-cart.component').then(
            (m) => m.ShopCartComponent,
          ),
      },
      {
        path: 'product/:id',
        loadComponent: () =>
          import('./shop/shop-product-detail/shop-product-detail.component').then(
            (m) => m.ShopProductDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'tool-pages',
    canActivate: [authGuard],
    children: TOOL_PAGE_ROUTES,
  },
  {
    path: 'cycle-calendar',
    loadComponent: () =>
      import('./cycle-calendar/cycle-calendar.component').then(
        (m) => m.CycleCalendarComponent
      ),
  },
  {
    path: 'pregnancy-mode',
    loadComponent: () =>
      import('./pregnancy-mode/pregnancy-mode.component').then(
        (m) => m.PregnancyModeComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'pregnancy-planning',
    loadComponent: () =>
      import('./pregnancy-planning/pregnancy-planning.component').then(
        (m) => m.PregnancyPlanningComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'reproductive-status',
    loadComponent: () =>
      import(
        './features/profile/reproductive-status/reproductive-status.component'
      ).then((m) => m.ReproductiveStatusComponent),
    canActivate: [authGuard],
  },
  {
    path: 'pregnancy-journey',
    loadComponent: () =>
      import('./pregnancy-planning/pregnancy-planning.component').then(
        (m) => m.PregnancyPlanningComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'postpartum',
    loadComponent: () =>
      import('./pregnancy-planning/pregnancy-planning.component').then(
        (m) => m.PregnancyPlanningComponent
      ),
    canActivate: [authGuard],
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
    canActivate: [authGuard],
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
        path: 'insights',
        loadComponent: () =>
          import('./insights/insights.component').then(
            (m) => m.InsightsComponent
          ),
      },
      {
        path: 'secret-chats',
        loadComponent: () =>
          import('./secret-chats/secret-chats').then(
            (m) => m.SecretChatsComponent
          ),
      },
      {
        path: 'consultation',
        loadComponent: () =>
          import('./consultation/consultation.component').then(
            (m) => m.ConsultationComponent
          ),
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
    loadComponent: () =>
      import('./splash/splash.component').then((m) => m.SplashComponent),
  },
];
