import { Component } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from './shared/shared-standalone';

/**
 * Root shell. `ion-app` exists after first render; palette class must live on it for Ionic dark CSS.
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class AppComponent {}
