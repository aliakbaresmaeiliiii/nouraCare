import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo-loading',
  standalone: true,
  imports: [],
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
