import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <div class="empty__mark" aria-hidden="true">◇</div>
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <div class="empty__actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .empty {
      text-align: center;
      padding: 2.5rem 1.25rem;
      border: 1px dashed var(--admin-line);
      border-radius: var(--admin-radius);
      background: var(--admin-surface);
    }
    .empty__mark {
      font-size: 1.5rem;
      color: var(--admin-accent);
      margin-bottom: 0.5rem;
    }
    h3 { margin: 0; font-size: 1rem; }
    p { margin: 0.4rem 0 0; color: var(--admin-muted); font-size: 0.86rem; }
    .empty__actions { margin-top: 1rem; }
  `,
})
export class AdminEmptyStateComponent {
  readonly title = input('Nothing here yet');
  readonly message = input('');
}
