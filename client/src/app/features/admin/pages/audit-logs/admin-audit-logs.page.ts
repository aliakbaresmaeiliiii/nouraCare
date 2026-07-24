import { Component } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { AdminEmptyStateComponent } from '../../shared-ui/empty-state/admin-empty-state.component';

@Component({
  selector: 'app-admin-audit-logs-page',
  standalone: true,
  imports: [TranslatePipe, AdminEmptyStateComponent],
  template: `
    <section class="admin-page">
      <header class="admin-page__header">
        <div>
          <h1>{{ 'admin.audit.title' | translate }}</h1>
          <p>{{ 'admin.audit.subtitle' | translate }}</p>
        </div>
      </header>
      <app-admin-empty-state
        [title]="'admin.audit.empty' | translate"
        [message]="'admin.audit.subtitle' | translate"
      />
    </section>
  `,
  styleUrl: './admin-audit-logs.page.scss',
})
export class AdminAuditLogsPage {}
