import { Routes } from '@angular/router';
import { authGuard } from '@app/core/auth/guards/auth.guard';
import { LayoutComponent } from '@app/core/layout/layout.component';

export const TABS_ROUTES: Routes = [
  {
    path: 'tabs',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('@app/features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'tools',
        loadComponent: () =>
          import('@app/features/tools/tools.component').then((m) => m.ToolsComponent),
      },
      {
        path: 'insights',
        loadComponent: () =>
          import('@app/features/insights/insights.component').then(
            (m) => m.InsightsComponent,
          ),
      },
      {
        path: 'secret-chats',
        loadComponent: () =>
          import('@app/features/community/secret-chats/secret-chats').then(
            (m) => m.SecretChatsComponent,
          ),
      },
      {
        path: 'consultation',
        loadComponent: () =>
          import('@app/features/consultation/consultation.component').then(
            (m) => m.ConsultationComponent,
          ),
      },
      {
        path: 'school',
        loadComponent: () =>
          import('@app/features/school/school.component').then((m) => m.SchoolComponent),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('@app/features/about/about.component').then((m) => m.AboutComponent),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
];
