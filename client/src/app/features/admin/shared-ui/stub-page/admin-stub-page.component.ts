import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-admin-stub-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="admin-page">
      <header class="admin-page__header">
        <div>
          <h1>{{ title() | translate }}</h1>
          @if (description()) {
            <p>{{ description() | translate }}</p>
          }
        </div>
        <div class="admin-page__actions">
          <ng-content select="[actions]" />
        </div>
      </header>

      <div class="admin-grid-2">
        <section class="admin-panel">
          <h3>{{ panelTitle() | translate }}</h3>
          <p class="stub-copy">{{ panelBody() | translate }}</p>
          @if (relatedPath()) {
            <a class="admin-btn admin-btn--primary" [routerLink]="relatedPath()">
              {{ relatedLabel() | translate }}
            </a>
          }
        </section>
        <section class="admin-panel stub-panel">
          <h3>{{ 'admin.stub.comingNext' | translate }}</h3>
          <ul>
            @for (item of bullets(); track item) {
              <li>{{ item | translate }}</li>
            }
          </ul>
        </section>
      </div>
      <ng-content />
    </section>
  `,
  styleUrl: './admin-stub-page.component.scss',
})
export class AdminStubPageComponent {
  /** i18n key for page title */
  readonly title = input.required<string>();
  /** i18n key for subtitle */
  readonly description = input('');
  readonly panelTitle = input('admin.stub.overview');
  readonly panelBody = input('admin.stub.panelBody');
  readonly relatedPath = input('');
  readonly relatedLabel = input('admin.stub.openRelated');
  readonly bullets = input<string[]>([
    'admin.stub.bullet1',
    'admin.stub.bullet2',
    'admin.stub.bullet3',
  ]);
}
