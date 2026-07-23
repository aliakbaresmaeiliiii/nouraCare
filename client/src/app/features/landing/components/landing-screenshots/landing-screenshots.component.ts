import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-screenshots',
  standalone: true,
  templateUrl: './landing-screenshots.component.html',
  styleUrl: './landing-screenshots.component.scss',
})
export class LandingScreenshotsComponent {
  readonly shots = [
    {
      title: 'Today',
      caption: 'Your cycle at a glance — phase, timing, and next steps.',
      tone: 'sea',
    },
    {
      title: 'Insights',
      caption: 'Patterns and guidance that stay grounded in your data.',
      tone: 'ink',
    },
    {
      title: 'Care',
      caption: 'Tools, school content, and consultations in one flow.',
      tone: 'coral',
    },
  ] as const;
}
