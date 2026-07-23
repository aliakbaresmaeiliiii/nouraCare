import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@app/core/auth/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-example">
      <h2>Authentication Example</h2>
      
      <div *ngIf="authService.isAuthenticated(); else notAuthenticated">
        <p>✅ User is authenticated</p>
        <p>Current User: {{ authService.currentUser() | json }}</p>
        <button (click)="logout()">Logout</button>
      </div>
      
      <ng-template #notAuthenticated>
        <p>❌ User is not authenticated</p>
        <p>Please login to access protected routes</p>
      </ng-template>
      
      <div class="token-info">
        <h3>Token Information</h3>
        <p>Access Token: {{ authService.getAccessToken() ? 'Present' : 'Not Present' }}</p>
        <p>Refresh Token: {{ hasRefreshToken() ? 'Present' : 'Not Present' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .auth-example {
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      margin: 20px;
    }
    
    .token-info {
      margin-top: 20px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    button {
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background-color: #0056b3;
    }
  `]
})
export class AuthExampleComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe();

    this.authService.accessToken$.subscribe();
  }

  logout() {
    this.authService.logout();
  }

  hasRefreshToken(): boolean {
    return !!localStorage.getItem('refresh_token');
  }
}
