import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  NOTIFICATIONS_SEED,
  countUnreadNotifications,
} from '@app/features/notifications/notifications.seed';

@Injectable({ providedIn: 'root' })
export class NotificationUnreadService {
  private readonly unreadSubject = new BehaviorSubject<number>(
    countUnreadNotifications(NOTIFICATIONS_SEED),
  );

  readonly unreadCount$ = this.unreadSubject.asObservable();

  getUnreadCount(): number {
    return this.unreadSubject.value;
  }

  /** Call whenever the in-app notifications list changes (read, delete, clear, etc.). */
  syncFromList(notifications: { isRead: boolean }[]): void {
    this.unreadSubject.next(countUnreadNotifications(notifications));
  }
}
