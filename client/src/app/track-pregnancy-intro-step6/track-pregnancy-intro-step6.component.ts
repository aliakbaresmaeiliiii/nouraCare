import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

/** Legacy loader — compact flow uses step12 → home instead. */
@Component({
  selector: 'app-track-pregnancy-intro-step6',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step6.component.html',
  styleUrls: ['./track-pregnancy-intro-step6.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep6Component implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    void this.router.navigate(['/track-pregnancy-intro-step12'], {
      replaceUrl: true,
    });
  }

  progress = 0;
}
