import { Component } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-landing-how',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './landing-how.component.html',
  styleUrl: './landing-how.component.scss',
})
export class LandingHowComponent {
  readonly steps = [1, 2, 3] as const;

  titleKey(n: number): string {
    return `landing.how.${n}.title`;
  }

  bodyKey(n: number): string {
    return `landing.how.${n}.body`;
  }
}
