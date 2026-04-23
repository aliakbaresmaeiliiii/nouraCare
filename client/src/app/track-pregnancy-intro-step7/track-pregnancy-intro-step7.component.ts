import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

type ProgramBenefit = {
  icon: string;
  text: string;
};

@Component({
  selector: 'app-track-pregnancy-intro-step7',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step7.component.html',
  styleUrls: ['./track-pregnancy-intro-step7.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep7Component {
  private router = inject(Router);

  readonly benefits: ProgramBenefit[] = [
    { icon: '👶', text: 'See how your baby and body develop' },
    { icon: '✅', text: "Know your do's and don'ts" },
    { icon: '🥗', text: 'Get healthy nutrition tips' },
    { icon: '🏃', text: 'Learn how to stay active' },
    { icon: '🧘', text: 'Practice meditation to reduce stress' },
    { icon: '👨‍👩‍👧', text: 'Join the supportive community of first-time parents' },
  ];

  continueNext(): void {
    void this.router.navigate(['/edit-profile'], {
      queryParams: { pregnancyIntro: '1' },
    });
  }
}
