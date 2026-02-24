import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { UserInfoService } from './shared/services/user-info.service';
import { OnboardingStateService } from './shared/services/onboarding-state.service';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private userInfoService = inject(UserInfoService);
  private onboardingStateService = inject(OnboardingStateService);
  private router = inject(Router);

  constructor() {
    // Initialize user info service on app start
    this.userInfoService.loadUserInfoOnInit();
  }

  ngOnInit() {
    // Check if user should be redirected based on authentication and onboarding status
    this.handleInitialRouting();
    console.log('🌍 Environment file loaded:', environment);
  }

  private handleInitialRouting() {
    // Only skip onboarding and go to tabs when user is logged in AND has completed onboarding
    const hasUserInfo = this.onboardingStateService.isUserAuthenticated();
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';
    if (hasUserInfo && hasCompletedOnboarding) {
      this.router.navigate(['/tabs/home']);
    }
    // Otherwise default route shows onboarding first
  }
}
