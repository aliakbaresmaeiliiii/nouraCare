import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';

@Component({
  selector: 'app-track-pregnancy-intro-step13',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step13.component.html',
  styleUrls: ['./track-pregnancy-intro-step13.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep13Component {
  private router = inject(Router);
  private cycleSettings = inject(CycleSettingsService);
  readonly progressValue = 1;
  readonly heroImageSrc =
    'assets/images/onboarding/track-pregnancy-intro-step13-premium.png';

  continueNext(): void {
    this.cycleSettings.applyTryingToConceiveHomeMode();
    this.cycleSettings.pinSelectedViewToNextPredictedOvulation();
    void this.router.navigate(['/tabs/home'], {
      replaceUrl: true,
    });
  }
}
