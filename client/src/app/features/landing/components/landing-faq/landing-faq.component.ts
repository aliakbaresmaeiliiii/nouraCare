import { Component, signal } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-landing-faq',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './landing-faq.component.html',
  styleUrl: './landing-faq.component.scss',
})
export class LandingFaqComponent {
  readonly openIndex = signal<number | null>(0);
  readonly faqKeys = [1, 2, 3, 4] as const;

  toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }

  qKey(n: number): string {
    return `landing.faq.${n}.q`;
  }

  aKey(n: number): string {
    return `landing.faq.${n}.a`;
  }
}
