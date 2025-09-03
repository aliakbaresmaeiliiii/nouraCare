import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';

interface Notification {
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

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [SharedModule],
})
export class NotificationsComponent implements OnInit {
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';
  selectedFilter = 'all';
  showUnreadOnly = false;

  notifications: Notification[] = [
    {
      id: 1,
      title: 'Period Reminder',
      message: 'Your period is expected to start in 3 days. Don\'t forget to track it!',
      type: 'reminder',
      category: 'health',
      isRead: false,
      timestamp: '2024-01-15T10:30:00Z',
      actionUrl: '/period-edit',
      actionText: 'Update Period',
      icon: 'calendar-outline',
      priority: 'high'
    },
    {
      id: 2,
      title: 'New Article Available',
      message: 'Check out our latest article on "Natural Remedies for Period Pain"',
      type: 'info',
      category: 'health',
      isRead: false,
      timestamp: '2024-01-15T09:15:00Z',
      actionUrl: '/article/123',
      actionText: 'Read Article',
      icon: 'document-text-outline',
      priority: 'medium'
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
      priority: 'medium'
    },
    {
      id: 4,
      title: 'App Update Available',
      message: 'A new version of Gahvareh is available with improved features',
      type: 'update',
      category: 'update',
      isRead: true,
      timestamp: '2024-01-14T14:20:00Z',
      actionUrl: '/check-version',
      actionText: 'Update Now',
      icon: 'refresh-outline',
      priority: 'low'
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
      priority: 'high'
    },
    {
      id: 6,
      title: 'Health Tip',
      message: 'Did you know? Drinking warm water with lemon can help with period cramps',
      type: 'info',
      category: 'health',
      isRead: true,
      timestamp: '2024-01-13T10:15:00Z',
      icon: 'bulb-outline',
      priority: 'low'
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
      priority: 'low'
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
      priority: 'medium'
    }
  ];

  filters = [
    { value: 'all', label: 'All', icon: 'list-outline' },
    { value: 'unread', label: 'Unread', icon: 'mail-unread-outline' },
    { value: 'health', label: 'Health', icon: 'medical-outline' },
    { value: 'social', label: 'Social', icon: 'people-outline' },
    { value: 'reminder', label: 'Reminders', icon: 'alarm-outline' },
    { value: 'update', label: 'Updates', icon: 'refresh-outline' }
  ];

  constructor() { }

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading = true;
    // Simulate loading notifications from API
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onFilterChange(filter: string | number) {
    this.selectedFilter = filter.toString();
  }

  toggleUnreadOnly() {
    this.showUnreadOnly = !this.showUnreadOnly;
  }

  markAsRead(notificationId: number) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.showSuccessAlert('Notification marked as read');
    }
  }

  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.isRead = true;
    });
    this.showSuccessAlert('All notifications marked as read');
  }

  deleteNotification(notificationId: number) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.showSuccessAlert('Notification deleted');
  }

  clearAllNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
      this.notifications = [];
      this.showSuccessAlert('All notifications cleared');
    }
  }

  onNotificationClick(notification: Notification) {
    // Mark as read when clicked
    if (!notification.isRead) {
      notification.isRead = true;
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  get filteredNotifications(): Notification[] {
    let filtered = this.notifications;

    // Filter by selected category
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(notification => notification.category === this.selectedFilter);
    }

    // Filter by unread only
    if (this.showUnreadOnly) {
      filtered = filtered.filter(notification => !notification.isRead);
    }

    // Sort by priority and timestamp
    return filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      case 'reminder': return 'primary';
      case 'update': return 'secondary';
      default: return 'medium';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'success': return 'checkmark-circle-outline';
      case 'warning': return 'warning-outline';
      case 'error': return 'close-circle-outline';
      case 'reminder': return 'alarm-outline';
      case 'update': return 'refresh-outline';
      default: return 'information-circle-outline';
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

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown time';
    }
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }

  private showSuccessAlert(message: string): void {
    const alert = document.createElement('ion-alert');
    alert.header = 'Success';
    alert.message = message;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    alert.present();
  }

  private showErrorAlert(message: string): void {
    const alert = document.createElement('ion-alert');
    alert.header = 'Error';
    alert.message = message;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    alert.present();
  }
}
