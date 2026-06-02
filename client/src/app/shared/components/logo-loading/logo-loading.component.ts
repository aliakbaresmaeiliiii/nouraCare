import { Component, input } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-logo-loading',
  standalone: true,
  imports: [IonSpinner],
  templateUrl: './logo-loading.component.html',
  styleUrl: './logo-loading.component.scss',
})
export class LogoLoadingComponent {
  /** Optional line shown under the spinner. */
  readonly message = input<string>();
  /**
   * `page`: tall block centered in `ion-content` (default).
   * `embedded`: compact block for overlays / fixed dialogs.
   */
  readonly layout = input<'page' | 'embedded'>('page');
  readonly ariaLabel = input('Loading');
}
