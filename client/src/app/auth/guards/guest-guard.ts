import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '../services/auth';

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  authService = inject(Auth);
  router = inject(Router);

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      // If already logged in → redirect to dashboard
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true; // Not logged in → allow access
  }
}
