import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  alarmOutline,
  bulbOutline,
  calendarOutline,
  chatbubblesOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  closeCircleOutline,
  closeOutline,
  cloudOfflineOutline,
  documentTextOutline,
  funnelOutline,
  informationCircleOutline,
  listOutline,
  mailUnreadOutline,
  medicalOutline,
  notificationsOffOutline,
  peopleOutline,
  personAddOutline,
  personOutline,
  refreshOutline,
  trashOutline,
  warningOutline,
} from 'ionicons/icons';
import type { RefresherCustomEvent } from '@ionic/core';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { NotificationUnreadService } from '../shared/services/notification-unread.service';
import { NOTIFICATIONS_SEED, type Notification } from './notifications.seed';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class NotificationsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly notificationUnread = inject(NotificationUnreadService);

  isLoading = false;
  errorMessage = '';
  selectedFilter = 'all';

  notifications: Notification[] = NOTIFICATIONS_SEED.map((n) => ({ ...n }));

  readonly filters: { value: string; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'list-outline' },
    { value: 'unread', label: 'Unread', icon: 'mail-unread-outline' },
    { value: 'health', label: 'Health', icon: 'medical-outline' },
    { value: 'social', label: 'Social', icon: 'people-outline' },
    { value: 'reminder', label: 'Reminders', icon: 'alarm-outline' },
    { value: 'update', label: 'Updates', icon: 'refresh-outline' },
  ];

  constructor() {
    addIcons({
      alarmOutline,
      bulbOutline,
      calendarOutline,
      chatbubblesOutline,
      checkmarkCircleOutline,
      checkmarkDoneOutline,
      checkmarkOutline,
      closeCircleOutline,
      closeOutline,
      cloudOfflineOutline,
      documentTextOutline,
      funnelOutline,
      informationCircleOutline,
      listOutline,
      mailUnreadOutline,
      medicalOutline,
      notificationsOffOutline,
      peopleOutline,
      personAddOutline,
      personOutline,
      refreshOutline,
      trashOutline,
      warningOutline,
    });
  }

  ngOnInit(): void {
    this.syncHeaderUnread();
    void this.loadNotifications().finally(() => this.syncHeaderUnread());
  }

  private syncHeaderUnread(): void {
    this.notificationUnread.syncFromList(this.notifications);
  }

  get emptyFilterHint(): string {
    switch (this.selectedFilter) {
      case 'unread':
        return 'You have no unread notifications. Open “All” or pick another category.';
      case 'health':
        return 'No health notifications match this filter.';
      case 'social':
        return 'No social notifications match this filter.';
      case 'reminder':
        return 'No reminders in this list right now.';
      case 'update':
        return 'No app or content updates here yet.';
      default:
        return 'Try another filter.';
    }
  }

  async loadNotifications(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      await new Promise((r) => setTimeout(r, 350));
    } catch {
      this.errorMessage = 'Could not load notifications. Check your connection and try again.';
    } finally {
      this.isLoading = false;
    }
  }

  retryLoad(): void {
    void this.loadNotifications();
  }

  onRefresh(event: RefresherCustomEvent): void {
    void this.loadNotifications().finally(() => event.detail.complete());
  }

  async markAsRead(notificationId: number, ev: Event): Promise<void> {
    ev.stopPropagation();
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.syncHeaderUnread();
      await this.showToast('Marked as read');
    }
  }

  async markAllAsRead(): Promise<void> {
    if (this.unreadCount === 0) {
      return;
    }
    this.notifications.forEach((n) => {
      n.isRead = true;
    });
    this.syncHeaderUnread();
    await this.showToast('All notifications marked as read');
  }

  async deleteNotification(notificationId: number, ev: Event): Promise<void> {
    ev.stopPropagation();
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    this.syncHeaderUnread();
    await this.showToast('Notification removed');
  }

  async clearAllNotifications(): Promise<void> {
    if (this.notifications.length === 0) {
      return;
    }
    const alert = await this.alertController.create({
      header: 'Clear all notifications?',
      message: 'This removes every item from your list. You cannot undo this.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear all',
          role: 'destructive',
          handler: () => {
            this.notifications = [];
            this.syncHeaderUnread();
            void this.showToast('All notifications cleared');
          },
        },
      ],
    });
    await alert.present();
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      notification.isRead = true;
      this.syncHeaderUnread();
    }
    if (notification.actionUrl) {
      void this.router.navigate([notification.actionUrl]);
    }
  }

  get filteredNotifications(): Notification[] {
    let filtered = this.notifications;

    if (this.selectedFilter === 'unread') {
      filtered = filtered.filter((n) => !n.isRead);
    } else if (this.selectedFilter !== 'all') {
      filtered = filtered.filter((n) => n.category === this.selectedFilter);
    }

    return [...filtered].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'warning':
        return 'warning-outline';
      case 'error':
        return 'close-circle-outline';
      case 'reminder':
        return 'alarm-outline';
      case 'update':
        return 'refresh-outline';
      default:
        return 'information-circle-outline';
    }
  }

  formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) {
        return 'Just now';
      }
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      }
      if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      }
      if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown time';
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
