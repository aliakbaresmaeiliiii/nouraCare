import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step3',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step3.component.html',
  styleUrls: ['./track-pregnancy-intro-step3.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep3Component {
  private router = inject(Router);

  readonly heroImageSrc = 'assets/images/onboarding/step2.jpg';

  constructor() {
    addIcons({ chevronBack });
  }

  goBack(): void {
    void this.router.navigate(['/track-pregnancy-intro-step2']);
  }

  continueNext(): void {
    void this.router.navigate(['/track-pregnancy-intro-step4']);
  }
}
