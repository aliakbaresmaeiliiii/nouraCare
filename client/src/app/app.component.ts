import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { UserInfoService } from './shared/services/user-info.service';
import { OnboardingStateService } from './shared/services/onboarding-state.service';
import { WebSocketService } from './shared/services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private userInfoService = inject(UserInfoService);
  private onboardingStateService = inject(OnboardingStateService);
  private router = inject(Router);
  private webSocketService = inject(WebSocketService);

  constructor() {
    // Initialize user info service on app start
    this.userInfoService.loadUserInfoOnInit();
  }

  ngOnInit() {
    // Check if user should be redirected based on authentication and onboarding status
    this.handleInitialRouting();
  }

  private handleInitialRouting() {
    // Check if user is authenticated (has data in localStorage)
    if (this.onboardingStateService.isUserAuthenticated()) {
      // User has existing data, redirect to home page
      this.router.navigate(['/tabs/home']);
    }
    // Otherwise, let the default routing handle it (which goes to onboarding)
  }
}
