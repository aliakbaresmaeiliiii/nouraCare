import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-landing-faq',
  standalone: true,
  templateUrl: './landing-faq.component.html',
  styleUrl: './landing-faq.component.scss',
})
export class LandingFaqComponent {
  readonly openIndex = signal<number | null>(0);

  readonly faqs = [
    {
      q: 'Is Dore free to start?',
      a: 'Yes. You can create an account and begin tracking right away. Premium tools can be added later if you need them.',
    },
    {
      q: 'Does it work for pregnancy and postpartum too?',
      a: 'Dore supports cycle tracking, fertility planning, pregnancy week journeys, and postpartum modes so your plan can grow with you.',
    },
    {
      q: 'Is my health data private?',
      a: 'Your account is protected with secure authentication. You control profile and privacy settings inside the app.',
    },
    {
      q: 'Can I use Dore on my phone?',
      a: 'Dore is a mobile-first web and Android experience. Open the app from this site and continue on your device.',
    },
  ] as const;

  toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }
}
