import { computed, Injectable, signal } from '@angular/core';
import { AdminNotificationItem } from '../models/admin.models';

/** Live notifications feed — empty until a real API is wired. */
@Injectable({ providedIn: 'root' })
export class AdminNotificationsService {
  readonly items = signal<AdminNotificationItem[]>([]);
  readonly unreadCount = computed(
    () => this.items().filter((n) => !n.read).length,
  );

  markAllRead(): void {
    this.items.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  markRead(id: string): void {
    this.items.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }
}
