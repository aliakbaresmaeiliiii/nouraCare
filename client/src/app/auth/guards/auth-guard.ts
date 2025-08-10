import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Token } from '../services/token';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  router = inject(Router);
  tokenService = inject(Token);

  canActivate(): boolean {
    if (!this.tokenService.getToken()) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    return true;
  }
}
