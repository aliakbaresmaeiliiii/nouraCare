import { computed, Injectable, signal } from '@angular/core';
import { MOCK_NOTIFICATIONS } from '../mocks/notifications.mock';
import { AdminNotificationItem } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminNotificationsService {
  readonly items = signal<AdminNotificationItem[]>([...MOCK_NOTIFICATIONS]);
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

  /** Relative time label (fa-friendly). */
  relativeTime(iso: string, lang = 'fa'): string {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(ms / 60000));
    if (lang === 'fa') {
      if (mins < 1) return 'همین الان';
      if (mins < 60) return `${mins} دقیقه پیش`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} ساعت پیش`;
      const days = Math.floor(hours / 24);
      return `${days} روز پیش`;
    }
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
