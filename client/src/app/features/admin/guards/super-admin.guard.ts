import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '@app/core/auth/services/auth';
import { AdminSessionService } from '../data/services/admin-session.service';

/**
 * Combined auth + admin panel gate for `/admin/**`.
 * Allows SUPER_ADMIN and ADMIN. Unauthenticated → sign-in with returnUrl.
 */
export const superAdminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const session = inject(AdminSessionService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    session.clear();
    return router.createUrlTree(['/app/auth/sign-in'], {
      queryParams: { returnUrl: state.url },
    });
  }

  return session.ensureSession().pipe(
    map((user) => {
      if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
        return true;
      }
      // Authenticated but not an admin — land on a clear denial page
      return router.createUrlTree(['/app/auth/sign-in'], {
        queryParams: {
          returnUrl: state.url,
          adminDenied: '1',
        },
      });
    }),
  );
};
