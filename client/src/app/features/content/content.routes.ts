import { Routes } from '@angular/router';

export const CONTENT_ROUTES: Routes = [
  {
    path: 'dorehealth-pro',
    loadComponent: () =>
      import('@app/features/content/dorehealth-pro/dorehealth-pro.component').then(
        (m) => m.DorehealthProComponent,
      ),
  },
  {
    path: 'invite-friends',
    loadComponent: () =>
      import('@app/features/content/invite-friends/invite-friends.component').then(
        (m) => m.InviteFriendsComponent,
      ),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('@app/features/notifications/notifications.component').then(
        (m) => m.NotificationsComponent,
      ),
  },
  {
    path: 'article/:id',
    loadComponent: () =>
      import('@app/features/content/article-detail/article-detail.component').then(
        (m) => m.ArticleDetailComponent,
      ),
  },
];
