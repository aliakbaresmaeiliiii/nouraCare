import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline } from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import {
  SupportTicketDetail,
  SupportTicketService,
} from '@app/shared/services/support-ticket.service';
import { TranslationService } from '@app/shared/services/translation.service';

@Component({
  selector: 'app-support-ticket-detail',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, FormsModule, DatePipe],
  templateUrl: './support-ticket-detail.page.html',
  styleUrls: ['./support-ticket-detail.page.scss'],
  host: { class: 'ion-page' },
})
export class SupportTicketDetailPage implements OnInit {
  private readonly api = inject(SupportTicketService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly i18n = inject(TranslationService);

  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly ticket = signal<SupportTicketDetail | null>(null);

  reply = '';

  constructor() {
    addIcons({ sendOutline });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('support.detail.error');
      this.loading.set(false);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('support.detail.error');
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/support-tickets']);
  }

  statusKey(status: string): string {
    return `support.status.${status}`;
  }

  categoryKey(category: string): string {
    return `support.category.${category}`;
  }

  async sendReply(): Promise<void> {
    const ticket = this.ticket();
    const body = this.reply.trim();
    if (!ticket || !body || this.sending() || !ticket.canReply) return;

    this.sending.set(true);
    this.api.reply(ticket.id, body).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.reply = '';
        this.sending.set(false);
      },
      error: async () => {
        this.sending.set(false);
        const toast = await this.toastCtrl.create({
          message: this.i18n.translate('support.detail.replyError'),
          duration: 2400,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }
}
