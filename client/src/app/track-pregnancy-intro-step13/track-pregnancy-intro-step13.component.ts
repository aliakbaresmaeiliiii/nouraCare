import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

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
  readonly heroImageSrc =
    'assets/images/onboarding/track-pregnancy-intro-step13-premium.png';

  continueNext(): void {
    void this.router.navigate(['/edit-profile'], {
      queryParams: { pregnancyIntro: '1' },
    });
  }
}
