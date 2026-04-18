export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'update';
  category: 'system' | 'health' | 'social' | 'reminder' | 'update';
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  priority: 'low' | 'medium' | 'high';
}

/** Demo seed data; keep in sync with `NotificationUnreadService` via `countUnreadNotifications`. */
export const NOTIFICATIONS_SEED: Notification[] = [
  {
    id: 1,
    title: 'Period Reminder',
    message:
      "Your period is expected to start in 3 days. Don't forget to track it!",
    type: 'reminder',
    category: 'health',
    isRead: false,
    timestamp: '2024-01-15T10:30:00Z',
    actionUrl: '/period-edit',
    actionText: 'Update Period',
    icon: 'calendar-outline',
    priority: 'high',
  },
  {
    id: 2,
    title: 'New Article Available',
    message:
      'Check out our latest article on "Natural Remedies for Period Pain"',
    type: 'info',
    category: 'health',
    isRead: false,
    timestamp: '2024-01-15T09:15:00Z',
    actionUrl: '/article/123',
    actionText: 'Read Article',
    icon: 'document-text-outline',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Friend Request',
    message: 'Sarah Johnson sent you a friend request',
    type: 'info',
    category: 'social',
    isRead: true,
    timestamp: '2024-01-14T16:45:00Z',
    actionUrl: '/my-friends',
    actionText: 'View Request',
    icon: 'person-add-outline',
    priority: 'medium',
  },
  {
    id: 4,
    title: 'App Update Available',
    message: 'A new version of NouraCare is available with improved features',
    type: 'update',
    category: 'update',
    isRead: true,
    timestamp: '2024-01-14T14:20:00Z',
    actionUrl: '/check-version',
    actionText: 'Update Now',
    icon: 'refresh-outline',
    priority: 'low',
  },
  {
    id: 5,
    title: 'Consultation Reminder',
    message: 'You have a consultation scheduled tomorrow at 2:00 PM',
    type: 'reminder',
    category: 'health',
    isRead: false,
    timestamp: '2024-01-14T12:30:00Z',
    actionUrl: '/consultation',
    actionText: 'View Details',
    icon: 'medical-outline',
    priority: 'high',
  },
  {
    id: 6,
    title: 'Health Tip',
    message:
      'Did you know? Drinking warm water with lemon can help with period cramps',
    type: 'info',
    category: 'health',
    isRead: true,
    timestamp: '2024-01-13T10:15:00Z',
    icon: 'bulb-outline',
    priority: 'low',
  },
  {
    id: 7,
    title: 'Forum Activity',
    message: 'New discussion started in "Pregnancy Support" forum',
    type: 'info',
    category: 'social',
    isRead: true,
    timestamp: '2024-01-13T08:45:00Z',
    actionUrl: '/forums',
    actionText: 'Join Discussion',
    icon: 'chatbubbles-outline',
    priority: 'low',
  },
  {
    id: 8,
    title: 'Profile Completion',
    message: 'Complete your profile to get personalized health insights',
    type: 'reminder',
    category: 'system',
    isRead: false,
    timestamp: '2024-01-12T15:30:00Z',
    actionUrl: '/edit-profile',
    actionText: 'Complete Profile',
    icon: 'person-outline',
    priority: 'medium',
  },
];

export function countUnreadNotifications(items: { isRead: boolean }[]): number {
  return items.filter((n) => !n.isRead).length;
}
