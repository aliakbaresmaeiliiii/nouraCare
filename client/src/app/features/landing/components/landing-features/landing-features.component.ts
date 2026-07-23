import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-features',
  standalone: true,
  templateUrl: './landing-features.component.html',
  styleUrl: './landing-features.component.scss',
})
export class LandingFeaturesComponent {
  readonly features = [
    {
      title: 'Smart cycle tracking',
      body: 'Log periods, symptoms, and patterns with a timeline that stays readable and private.',
    },
    {
      title: 'Fertility insights',
      body: 'See fertile windows and predictions that adapt as your history grows.',
    },
    {
      title: 'Pregnancy journey',
      body: 'Week-by-week guidance, tools, and reminders when you are ready for the next chapter.',
    },
    {
      title: 'Care when you need it',
      body: 'Browse specialists, book consultations, and keep health context in one place.',
    },
    {
      title: 'Community & learning',
      body: 'Ask questions, follow school content, and learn at your own pace.',
    },
    {
      title: 'Built for trust',
      body: 'Account controls, privacy settings, and a calm interface designed for daily use.',
    },
  ] as const;

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
