import { Routes } from '@angular/router';
import { authGuard } from '@app/core/auth/guards/auth.guard';

export const PROFILE_ROUTES: Routes = [
  {
    path: 'profile',
    loadComponent: () =>
      import('@app/features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'edit-profile',
    loadComponent: () =>
      import('@app/features/profile/edit-profile/edit-profile.component').then(
        (m) => m.EditProfileComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'saved-information',
    loadComponent: () =>
      import('@app/features/profile/saved-information/saved-information.component').then(
        (m) => m.SavedInformationComponent,
      ),
  },
  {
    path: 'reproductive-status',
    loadComponent: () =>
      import(
        '@app/features/profile/reproductive-status/reproductive-status.component'
      ).then((m) => m.ReproductiveStatusComponent),
    canActivate: [authGuard],
  },
];
