export interface Notification {
  id: number;
  titleKey: string;
  messageKey: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'update';
  category: 'system' | 'health' | 'social' | 'reminder' | 'update';
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
  actionTextKey?: string;
  icon?: string;
  priority: 'low' | 'medium' | 'high';
}

/** Demo seed data; keep in sync with `NotificationUnreadService` via `countUnreadNotifications`. */
export const NOTIFICATIONS_SEED: Notification[] = [
  {
    id: 1,
    titleKey: 'notifications.seed.periodReminder.title',
    messageKey: 'notifications.seed.periodReminder.message',
    type: 'reminder',
    category: 'health',
    isRead: false,
    timestamp: '2024-01-15T10:30:00Z',
    actionUrl: '/period-edit',
    actionTextKey: 'notifications.seed.periodReminder.action',
    icon: 'calendar-outline',
    priority: 'high',
  },
  {
    id: 2,
    titleKey: 'notifications.seed.newArticle.title',
    messageKey: 'notifications.seed.newArticle.message',
    type: 'info',
    category: 'health',
    isRead: false,
    timestamp: '2024-01-15T09:15:00Z',
    actionUrl: '/article/123',
    actionTextKey: 'notifications.seed.newArticle.action',
    icon: 'document-text-outline',
    priority: 'medium',
  },
  {
    id: 3,
    titleKey: 'notifications.seed.friendRequest.title',
    messageKey: 'notifications.seed.friendRequest.message',
    type: 'info',
    category: 'social',
    isRead: true,
    timestamp: '2024-01-14T16:45:00Z',
    actionUrl: '/my-friends',
    actionTextKey: 'notifications.seed.friendRequest.action',
    icon: 'person-add-outline',
    priority: 'medium',
  },
  {
    id: 4,
    titleKey: 'notifications.seed.appUpdate.title',
    messageKey: 'notifications.seed.appUpdate.message',
    type: 'update',
    category: 'update',
    isRead: true,
    timestamp: '2024-01-14T14:20:00Z',
    actionUrl: '/check-version',
    actionTextKey: 'notifications.seed.appUpdate.action',
    icon: 'refresh-outline',
    priority: 'low',
  },
  {
    id: 5,
    titleKey: 'notifications.seed.consultationReminder.title',
    messageKey: 'notifications.seed.consultationReminder.message',
    type: 'reminder',
    category: 'health',
    isRead: false,
    timestamp: '2024-01-14T12:30:00Z',
    actionUrl: '/consultation',
    actionTextKey: 'notifications.seed.consultationReminder.action',
    icon: 'medical-outline',
    priority: 'high',
  },
  {
    id: 6,
    titleKey: 'notifications.seed.healthTip.title',
    messageKey: 'notifications.seed.healthTip.message',
    type: 'info',
    category: 'health',
    isRead: true,
    timestamp: '2024-01-13T10:15:00Z',
    icon: 'bulb-outline',
    priority: 'low',
  },
  {
    id: 7,
    titleKey: 'notifications.seed.forumActivity.title',
    messageKey: 'notifications.seed.forumActivity.message',
    type: 'info',
    category: 'social',
    isRead: true,
    timestamp: '2024-01-13T08:45:00Z',
    actionUrl: '/forums',
    actionTextKey: 'notifications.seed.forumActivity.action',
    icon: 'chatbubbles-outline',
    priority: 'low',
  },
  {
    id: 8,
    titleKey: 'notifications.seed.profileCompletion.title',
    messageKey: 'notifications.seed.profileCompletion.message',
    type: 'reminder',
    category: 'system',
    isRead: false,
    timestamp: '2024-01-12T15:30:00Z',
    actionUrl: '/edit-profile',
    actionTextKey: 'notifications.seed.profileCompletion.action',
    icon: 'person-outline',
    priority: 'medium',
  },
];

export function countUnreadNotifications(items: { isRead: boolean }[]): number {
  return items.filter((n) => !n.isRead).length;
}
