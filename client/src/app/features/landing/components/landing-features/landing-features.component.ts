import { Component } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-landing-features',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './landing-features.component.html',
  styleUrl: './landing-features.component.scss',
})
export class LandingFeaturesComponent {
  readonly featureKeys = [1, 2, 3, 4, 5, 6] as const;

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  titleKey(n: number): string {
    return `landing.features.${n}.title`;
  }

  bodyKey(n: number): string {
    return `landing.features.${n}.body`;
  }
}
