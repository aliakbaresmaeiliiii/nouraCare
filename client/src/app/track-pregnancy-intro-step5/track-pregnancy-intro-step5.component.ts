import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step5',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step5.component.html',
  styleUrls: ['./track-pregnancy-intro-step5.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep5Component {
  private router = inject(Router);

  readonly options = ['No restrictions', 'Vegetarian', 'Vegan', 'Other'];

  constructor() {
    addIcons({ chevronBack });
  }

  onBack(): void {
    void this.router.navigate(['/track-pregnancy-intro-step4']);
  }

  onSkip(): void {
    void this.router.navigate(['/track-pregnancy-intro-step6']);
  }

  onSelect(): void {
    void this.router.navigate(['/track-pregnancy-intro-step6']);
  }
}
