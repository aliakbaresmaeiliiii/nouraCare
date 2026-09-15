import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { AdminTicketListItem } from '../../data/models/admin-api.models';
import { AdminApiService } from '../../data/services/admin-api.service';
import {
  AdminDataTableComponent,
  AdminTableColumn,
} from '../../shared-ui/data-table/admin-data-table.component';
import { AdminSkeletonComponent } from '../../shared-ui/skeleton/admin-skeleton.component';

export interface AdminTicketRow {
  id: string;
  subject: string;
  user: string;
  category: string;
  status: string;
  messages: string;
  updated: string;
  raw: AdminTicketListItem;
}

@Component({
  selector: 'app-admin-tickets-page',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    AdminDataTableComponent,
    AdminSkeletonComponent,
  ],
  templateUrl: './admin-tickets.page.html',
  styleUrl: './admin-tickets.page.scss',
})
export class AdminTicketsPage implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);
  private readonly language = inject(LanguageService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AdminTicketRow[]>([]);
  readonly total = signal(0);
  readonly openCount = signal(0);
  readonly totalPages = signal(1);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly categoryFilter = signal('');

  private readonly lang = toSignal(this.language.currentLanguage$, {
    initialValue: this.language.getCurrentLanguage(),
  });

  readonly columns: AdminTableColumn<AdminTicketRow>[] = [
    { key: 'subject', label: 'admin.tickets.col.subject' },
    { key: 'user', label: 'admin.tickets.col.user' },
    { key: 'category', label: 'admin.tickets.col.category' },
    { key: 'status', label: 'admin.tickets.col.status' },
    { key: 'messages', label: 'admin.tickets.col.messages' },
    { key: 'updated', label: 'admin.tickets.col.updated' },
  ];

  readonly pageLabel = computed(() => {
    this.lang();
    return this.i18n.translateParams('admin.tickets.pageLabel', {
      page: this.page(),
      pages: this.totalPages(),
      total: this.total(),
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listTickets({
        page: this.page(),
        limit: this.limit(),
        search: this.search().trim() || undefined,
        status: this.statusFilter() || undefined,
        category: this.categoryFilter() || undefined,
      })
      .subscribe({
        next: (page) => {
          this.total.set(page.total);
          this.openCount.set(page.openCount);
          this.totalPages.set(page.totalPages);
          this.page.set(page.page);
          this.rows.set(page.items.map((t) => this.toRow(t)));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('admin.tickets.error');
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
    this.categoryFilter.set('');
    this.page.set(1);
    this.load();
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.load();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  openTicket(row: AdminTicketRow): void {
    void this.router.navigate(['/admin/tickets', row.id]);
  }

  statusKey(status: string): string {
    return `admin.tickets.status.${status}`;
  }

  categoryKey(category: string): string {
    return `admin.tickets.category.${category}`;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'admin-badge--warning';
      case 'IN_PROGRESS':
        return 'admin-badge';
      case 'WAITING_ON_USER':
        return 'admin-badge--warning';
      case 'RESOLVED':
        return 'admin-badge--success';
      case 'CLOSED':
        return 'admin-badge--muted';
      default:
        return '';
    }
  }

  private toRow(t: AdminTicketListItem): AdminTicketRow {
    return {
      id: t.id,
      subject: t.subject,
      user: t.user.fullName || t.user.email || `#${t.user.id}`,
      category: t.category,
      status: t.status,
      messages: String(t.messageCount),
      updated: t.lastMessageAt,
      raw: t,
    };
  }
}
