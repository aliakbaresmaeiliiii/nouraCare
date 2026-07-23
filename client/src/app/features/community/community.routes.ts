import { Routes } from '@angular/router';

export const COMMUNITY_ROUTES: Routes = [
  {
    path: 'blocked-users',
    loadComponent: () =>
      import('@app/features/community/blocked-users/blocked-users.component').then(
        (m) => m.BlockedUsersComponent,
      ),
  },
  {
    path: 'my-friends',
    loadComponent: () =>
      import('@app/features/community/my-friends/my-friends.component').then(
        (m) => m.MyFriendsComponent,
      ),
  },
  {
    path: 'forums',
    loadComponent: () =>
      import('@app/features/community/forums/forums.component').then(
        (m) => m.ForumsComponent,
      ),
  },
  {
    path: 'forums/topic/:id',
    loadComponent: () =>
      import('@app/features/community/forums/topic-detail/topic-detail.component').then(
        (m) => m.TopicDetailComponent,
      ),
  },
  {
    path: 'forums/create-post',
    loadComponent: () =>
      import('@app/features/community/forums/create-post/create-post.component').then(
        (m) => m.CreatePostComponent,
      ),
  },
  {
    path: 'chatbot',
    loadComponent: () =>
      import('@app/features/community/chatbot/chatbot.component').then(
        (m) => m.ChatbotComponent,
      ),
  },
];
