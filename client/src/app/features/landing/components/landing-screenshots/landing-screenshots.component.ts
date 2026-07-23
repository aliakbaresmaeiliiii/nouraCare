import { Component } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-landing-screenshots',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './landing-screenshots.component.html',
  styleUrl: './landing-screenshots.component.scss',
})
export class LandingScreenshotsComponent {
  readonly shots = [
    { n: 1, tone: 'sea' },
    { n: 2, tone: 'ink' },
    { n: 3, tone: 'coral' },
  ] as const;

  titleKey(n: number): string {
    return `landing.shots.${n}.title`;
  }

  captionKey(n: number): string {
    return `landing.shots.${n}.caption`;
  }
}
