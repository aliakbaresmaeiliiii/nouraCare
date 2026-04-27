import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro.component.html',
  styleUrls: ['./track-pregnancy-intro.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroComponent {
  private router = inject(Router);

  readonly heroImageSrc =
    'assets/images/onboarding/track-pregnancy-intro-confirm.png';

  constructor() {
    addIcons({ close });
  }

  close(): void {
    void this.router.navigate(['/edit-profile']);
  }

  continueNext(): void {
    void this.router.navigate(['/track-pregnancy-intro-step2']);
  }
}
