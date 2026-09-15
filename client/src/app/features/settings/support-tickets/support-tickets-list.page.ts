import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chatbubblesOutline,
  chevronForwardOutline,
  refreshOutline,
} from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import {
  SupportTicketListItem,
  SupportTicketService,
} from '@app/shared/services/support-ticket.service';
import { TranslationService } from '@app/shared/services/translation.service';

@Component({
  selector: 'app-support-tickets-list',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, RouterLink, DatePipe],
  templateUrl: './support-tickets-list.page.html',
  styleUrls: ['./support-tickets-list.page.scss'],
  host: { class: 'ion-page' },
})
export class SupportTicketsListPage implements OnInit {
  private readonly api = inject(SupportTicketService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<SupportTicketListItem[]>([]);

  constructor() {
    addIcons({
      addOutline,
      chatbubblesOutline,
      chevronForwardOutline,
      refreshOutline,
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list({ page: 1, limit: 50 }).subscribe({
      next: (page) => {
        this.items.set(page.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('support.tickets.error');
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/help-support']);
  }

  open(ticket: SupportTicketListItem): void {
    void this.router.navigate(['/support-tickets', ticket.id]);
  }

  statusKey(status: string): string {
    return `support.status.${status}`;
  }

  categoryKey(category: string): string {
    return `support.category.${category}`;
  }

  messagesLabel(count: number): string {
    return this.i18n.translateParams('support.tickets.messages', { count });
  }
}
