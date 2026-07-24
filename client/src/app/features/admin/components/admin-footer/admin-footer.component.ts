import { Component } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <footer class="admin-footer">
      <span>{{ 'admin.brand' | translate }}</span>
      <span class="admin-footer__meta">{{ 'admin.footer.meta' | translate }}</span>
    </footer>
  `,
  styles: `
    .admin-footer {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 0.85rem 1.5rem 1.25rem;
      color: var(--admin-muted);
      font-size: 0.78rem;
      border-top: 1px solid var(--admin-line);
      flex: 0 0 auto;
    }
    .admin-footer__meta {
      opacity: 0.85;
    }
  `,
})
export class AdminFooterComponent {}
