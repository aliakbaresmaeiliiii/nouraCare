import { AdminNotificationItem } from '../models/admin.models';

/** Demo feed for the admin notification popover (replace with live API later). */
export const MOCK_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: 'n1',
    title: 'جرمیا مینسک',
    body: 'شما را در یک کامنت ذکر کرد.',
    at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    read: false,
    kind: 'mention',
    avatarInitials: 'جم',
    avatarTone: 'violet',
    tone: 'info',
  },
  {
    id: 'n2',
    title: 'مکس الکساندر',
    body: 'شما را به پروژه جدید دعوت کرد.',
    at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    read: false,
    kind: 'invite',
    avatarInitials: 'ما',
    avatarTone: 'blue',
    tone: 'success',
  },
  {
    id: 'n3',
    title: '',
    body: 'لطفا گزارش روزانه خود را ارسال کنید.',
    at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
    kind: 'reminder',
    avatarInitials: '📅',
    avatarTone: 'teal',
    tone: 'info',
  },
  {
    id: 'n4',
    title: 'سیستم',
    body: 'کاربر جدید ثبت‌نام کرد و نیاز به بررسی دارد.',
    at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: false,
    kind: 'system',
    avatarInitials: 'س',
    avatarTone: 'orange',
    tone: 'warning',
  },
];
