import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TranslationService } from '@app/shared/services/translation.service';
import {
  AdminTicketDetail,
  AdminTicketStatus,
} from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminToastService } from '../../data/services/admin-toast.service';
import { AdminSkeletonComponent } from '../../shared-ui/skeleton/admin-skeleton.component';

@Component({
  selector: 'app-admin-ticket-detail-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    AdminSkeletonComponent,
  ],
  templateUrl: './admin-ticket-detail.page.html',
  styleUrl: './admin-ticket-detail.page.scss',
})
export class AdminTicketDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(AdminToastService);
  private readonly i18n = inject(TranslationService);

  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly ticket = signal<AdminTicketDetail | null>(null);

  reply = '';
  status: AdminTicketStatus = 'OPEN';

  readonly statuses: AdminTicketStatus[] = [
    'OPEN',
    'IN_PROGRESS',
    'WAITING_ON_USER',
    'RESOLVED',
    'CLOSED',
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('admin.tickets.notFound');
      this.loading.set(false);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.status = ticket.status;
        this.loading.set(false);
      },
      error: () => {
        this.error.set('admin.tickets.notFound');
        this.loading.set(false);
      },
    });
  }

  statusKey(status: string): string {
    return `admin.tickets.status.${status}`;
  }

  categoryKey(category: string): string {
    return `admin.tickets.category.${category}`;
  }

  saveStatus(): void {
    const ticket = this.ticket();
    if (!ticket || this.saving() || this.status === ticket.status) return;
    this.saving.set(true);
    this.api.updateTicket(ticket.id, { status: this.status }).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.status = updated.status;
        this.saving.set(false);
        this.toast.show(this.i18n.translate('admin.tickets.statusSaved'), 'success');
      },
      error: () => {
        this.saving.set(false);
        this.toast.show(this.i18n.translate('admin.tickets.statusError'), 'danger');
      },
    });
  }

  sendReply(): void {
    const ticket = this.ticket();
    const body = this.reply.trim();
    if (!ticket || !body || this.sending()) return;
    if (ticket.status === 'CLOSED') {
      this.toast.show(this.i18n.translate('admin.tickets.closedError'), 'warning');
      return;
    }

    this.sending.set(true);
    this.api.replyTicket(ticket.id, body).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.status = updated.status;
        this.reply = '';
        this.sending.set(false);
        this.toast.show(this.i18n.translate('admin.tickets.replySent'), 'success');
      },
      error: () => {
        this.sending.set(false);
        this.toast.show(this.i18n.translate('admin.tickets.replyError'), 'danger');
      },
    });
  }
}
