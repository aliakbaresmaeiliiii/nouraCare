import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-stub-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="admin-page">
      <header class="admin-page__header">
        <div>
          <h1>{{ title() }}</h1>
          <p>{{ description() }}</p>
        </div>
        <div class="admin-page__actions">
          <ng-content select="[actions]" />
        </div>
      </header>

      <div class="admin-grid-2">
        <section class="admin-panel">
          <h3>{{ panelTitle() }}</h3>
          <p class="stub-copy">{{ panelBody() }}</p>
          @if (relatedPath()) {
            <a class="admin-btn admin-btn--primary" [routerLink]="relatedPath()">{{ relatedLabel() }}</a>
          }
        </section>
        <section class="admin-panel stub-panel">
          <h3>Coming next</h3>
          <ul>
            @for (item of bullets(); track item) {
              <li>{{ item }}</li>
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
  readonly title = input.required<string>();
  readonly description = input('');
  readonly panelTitle = input('Overview');
  readonly panelBody = input(
    'This section is scaffolded and ready for deeper charts and workflows.',
  );
  readonly relatedPath = input('');
  readonly relatedLabel = input('Open related view');
  readonly bullets = input<string[]>([
    'Mock-data services already power related priority pages',
    'Wire real APIs without changing the shell',
    'Extend with feature-specific tables and exports',
  ]);
}
