import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step7',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step7.component.html',
  styleUrls: ['./track-pregnancy-intro-step7.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep7Component implements OnInit, OnDestroy {
  private router = inject(Router);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;
  readonly progressValue = 7 / 13;

  readonly featureItems = [
    'Get daily insights tailored to your pregnancy from medical experts.',
    "Understand your changing body and learn what's common for you.",
    "Stay informed with weekly updates on your baby's development.",
  ];
  readonly heroImageSrc = 'assets/images/onboarding/track-pregnancy-intro-confirm.png';

  ngOnInit(): void {
    this.redirectTimer = setTimeout(() => {
      this.goToNextStep();
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }

  continueNext(): void {
    this.goToNextStep();
  }

  private goToNextStep(): void {
    void this.router.navigate(['/track-pregnancy-intro-step8'], {
      replaceUrl: true,
    });
  }
}
