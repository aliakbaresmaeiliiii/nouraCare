import { Component, OnDestroy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { UserInfoService } from './shared/services/user-info.service';
import { OnboardingStateService } from './shared/services/onboarding-state.service';
import { SHARED_STANDALONE_IMPORTS } from './shared/shared-standalone';
import { addIcons } from 'ionicons';
import {
  heart,
  heartOutline,
  logInOutline,
  mailOutline,
  personAddOutline,
  shareOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class AppComponent implements OnInit, OnDestroy {
  private userInfoService = inject(UserInfoService);
  private onboardingStateService = inject(OnboardingStateService);
  private router = inject(Router);
  private splashTimeoutId: ReturnType<typeof setTimeout> | null = null;
  showStartupWelcome = true;

  constructor() {
    addIcons({
      shareOutline,
      heart,
      heartOutline,
      logInOutline,
      personAddOutline,
      mailOutline,
    });

    // Initialize user info service on app start
    this.userInfoService.loadUserInfoOnInit();
  }

  ngOnInit() {
    this.handleInitialRouting();
    this.splashTimeoutId = setTimeout(() => {
      this.showStartupWelcome = false;
    }, 2200);
    if (Capacitor.isNativePlatform()) {
      void Keyboard.setResizeMode({ mode: KeyboardResize.Ionic }).catch(() => {
        /* optional plugin */
      });
    }
  }

  ngOnDestroy(): void {
    if (this.splashTimeoutId) {
      clearTimeout(this.splashTimeoutId);
      this.splashTimeoutId = null;
    }
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
