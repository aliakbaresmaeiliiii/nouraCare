import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { NotificationUnreadService } from '@app/shared/services/notification-unread.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { LanguageService } from '@app/shared/services/language.service';
import { formatRecordedAtDate } from '@app/shared/utils/locale-date-format.util';
import { NOTIFICATIONS_SEED, type Notification } from '@app/features/notifications/notifications.seed';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly notificationUnread = inject(NotificationUnreadService);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private langChangeSub?: Subscription;

  isLoading = false;
  private errorKey = '';
  selectedFilter = 'all';

  notifications: Notification[] = NOTIFICATIONS_SEED.map((n) => ({ ...n }));

  readonly filters: { value: string; labelKey: string; icon: string }[] = [
    { value: 'all', labelKey: 'notifications.filter.all', icon: 'list-outline' },
    {
      value: 'unread',
      labelKey: 'notifications.filter.unread',
      icon: 'mail-unread-outline',
    },
    {
      value: 'health',
      labelKey: 'notifications.filter.health',
      icon: 'medical-outline',
    },
    {
      value: 'social',
      labelKey: 'notifications.filter.social',
      icon: 'people-outline',
    },
    {
      value: 'reminder',
      labelKey: 'notifications.filter.reminder',
      icon: 'alarm-outline',
    },
    {
      value: 'update',
      labelKey: 'notifications.filter.update',
      icon: 'refresh-outline',
    },
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
    this.langChangeSub = this.languageService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
    this.syncHeaderUnread();
    void this.loadNotifications().finally(() => this.syncHeaderUnread());
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }

  get errorMessage(): string {
    return this.errorKey ? this.t(this.errorKey) : '';
  }

  get unreadSummary(): string {
    return this.tParams('notifications.summaryUnread', {
      count: this.unreadCount,
    });
  }

  private syncHeaderUnread(): void {
    this.notificationUnread.syncFromList(this.notifications);
  }

  get emptyFilterHintKey(): string {
    switch (this.selectedFilter) {
      case 'unread':
        return 'notifications.emptyFilter.unread';
      case 'health':
        return 'notifications.emptyFilter.health';
      case 'social':
        return 'notifications.emptyFilter.social';
      case 'reminder':
        return 'notifications.emptyFilter.reminder';
      case 'update':
        return 'notifications.emptyFilter.update';
      default:
        return 'notifications.emptyFilter.default';
    }
  }

  async loadNotifications(): Promise<void> {
    this.isLoading = true;
    this.errorKey = '';
    try {
      await new Promise((r) => setTimeout(r, 350));
    } catch {
      this.errorKey = 'notifications.loadFailed';
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
      await this.showToast(this.t('notifications.toast.markedRead'));
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
    await this.showToast(this.t('notifications.toast.allMarkedRead'));
  }

  async deleteNotification(notificationId: number, ev: Event): Promise<void> {
    ev.stopPropagation();
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    this.syncHeaderUnread();
    await this.showToast(this.t('notifications.toast.removed'));
  }

  async clearAllNotifications(): Promise<void> {
    if (this.notifications.length === 0) {
      return;
    }
    const alert = await this.alertController.create({
      header: this.t('notifications.clearAll.header'),
      message: this.t('notifications.clearAll.message'),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('notifications.clearAll.confirm'),
          role: 'destructive',
          handler: () => {
            this.notifications = [];
            this.syncHeaderUnread();
            void this.showToast(this.t('notifications.toast.allCleared'));
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
        return this.t('notifications.time.justNow');
      }
      if (diffInMinutes < 60) {
        return this.tParams('notifications.time.minutesAgo', {
          minutes: diffInMinutes,
        });
      }
      if (diffInHours < 24) {
        return this.tParams('notifications.time.hoursAgo', {
          hours: diffInHours,
        });
      }
      if (diffInDays < 7) {
        return this.tParams('notifications.time.daysAgo', { days: diffInDays });
      }

      return formatRecordedAtDate(
        date,
        this.languageService.getCurrentLanguage(),
      );
    } catch {
      return this.t('notifications.time.unknown');
    }
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private tParams(
    key: string,
    params: Record<string, string | number>,
  ): string {
    return this.translation.translateParams(key, params);
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
