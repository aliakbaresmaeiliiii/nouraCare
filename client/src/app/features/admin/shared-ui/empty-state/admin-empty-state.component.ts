import { Component, input } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-admin-empty-state',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="empty">
      <div class="empty__mark" aria-hidden="true">◇</div>
      <h3>{{ title() | translate }}</h3>
      @if (message()) {
        <p>{{ message() | translate }}</p>
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
  /** i18n key or already-translated text */
  readonly title = input('admin.common.empty');
  readonly message = input('');
}
