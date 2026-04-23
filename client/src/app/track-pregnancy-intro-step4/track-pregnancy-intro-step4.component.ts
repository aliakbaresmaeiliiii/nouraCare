import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step4',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step4.component.html',
  styleUrls: ['./track-pregnancy-intro-step4.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep4Component {
  private router = inject(Router);

  readonly options = [
    'Rarely',
    'Several times a month',
    'Several times a week',
    'Almost every day',
  ];

  onSkip(): void {
    void this.router.navigate(['/edit-profile'], {
      queryParams: { pregnancyIntro: '1' },
    });
  }

  onSelect(): void {
    void this.router.navigate(['/track-pregnancy-intro-step5']);
  }
}
