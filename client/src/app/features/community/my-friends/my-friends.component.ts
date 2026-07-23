import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  ellipsisVerticalOutline,
  heart,
  heartOutline,
  peopleOutline,
  personAddOutline,
  radioButtonOnOutline,
  refreshOutline,
  shieldCheckmark,
  shieldOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import type { RefresherCustomEvent } from '@ionic/core';
import {
  ActionSheetController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { TranslationService } from '@app/shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';

interface Friend {
  id: number;
  name: string;
  profileImage?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  mutualFriends: number;
  isFavorite: boolean;
  isBlocked: boolean;
  joinedDate: string;
  bio?: string;
}

@Component({
  selector: 'app-my-friends',
  templateUrl: './my-friends.component.html',
  styleUrls: ['./my-friends.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class MyFriendsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly translation = inject(TranslationService);

  friends: Friend[] = [];
  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  selectedFilter = 'all';

  readonly filters = [
    { value: 'all', labelKey: 'myFriends.filter.all', icon: 'people-outline' },
    {
      value: 'online',
      labelKey: 'myFriends.filter.online',
      icon: 'radio-button-on-outline',
    },
    {
      value: 'favorites',
      labelKey: 'myFriends.filter.favorites',
      icon: 'heart-outline',
    },
    { value: 'recent', labelKey: 'myFriends.filter.recent', icon: 'time-outline' },
  ];

  constructor() {
    addIcons({
      alertCircleOutline,
      ellipsisVerticalOutline,
      heart,
      heartOutline,
      peopleOutline,
      personAddOutline,
      radioButtonOnOutline,
      refreshOutline,
      shieldCheckmark,
      shieldOutline,
      timeOutline,
      trashOutline,
    });
  }

  ngOnInit(): void {
    void this.loadFriends();
  }

  async loadFriends(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await new Promise((r) => setTimeout(r, 400));
      this.friends = [
        {
          id: 1,
          name: 'Sarah Johnson',
          profileImage: 'assets/images/nurse.png',
          status: 'online',
          mutualFriends: 12,
          isFavorite: true,
          isBlocked: false,
          joinedDate: '2023-06-15T10:30:00Z',
          bio: 'Health enthusiast and yoga lover',
        },
        {
          id: 2,
          name: 'Emily Chen',
          profileImage: 'assets/images/nurse.png',
          status: 'away',
          lastSeen: '2024-01-15T14:20:00Z',
          mutualFriends: 8,
          isFavorite: false,
          isBlocked: false,
          joinedDate: '2023-08-22T09:15:00Z',
          bio: 'Nutrition specialist and wellness coach',
        },
        {
          id: 3,
          name: 'Maria Rodriguez',
          profileImage: 'assets/images/nurse.png',
          status: 'offline',
          lastSeen: '2024-01-14T18:45:00Z',
          mutualFriends: 15,
          isFavorite: true,
          isBlocked: false,
          joinedDate: '2023-05-10T16:20:00Z',
          bio: 'Fitness trainer and health advocate',
        },
        {
          id: 4,
          name: 'Lisa Thompson',
          profileImage: 'assets/images/nurse.png',
          status: 'online',
          mutualFriends: 6,
          isFavorite: false,
          isBlocked: false,
          joinedDate: '2023-09-05T11:00:00Z',
          bio: 'Mental health counselor',
        },
        {
          id: 5,
          name: 'Jennifer Kim',
          profileImage: 'assets/images/nurse.png',
          status: 'offline',
          lastSeen: '2024-01-13T20:30:00Z',
          mutualFriends: 9,
          isFavorite: false,
          isBlocked: false,
          joinedDate: '2023-07-18T13:45:00Z',
          bio: 'Dance instructor and wellness blogger',
        },
      ];
    } catch {
      this.errorMessage = this.t('myFriends.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  onRefresh(event: RefresherCustomEvent): void {
    void this.loadFriends().finally(() => event.detail.complete());
  }

  onSearchChange(event: CustomEvent<{ value?: string | null }>): void {
    this.searchQuery = event.detail?.value ?? '';
  }

  private applyFavoriteToggle(friendId: number): void {
    const friend = this.friends.find((f) => f.id === friendId);
    if (friend) {
      friend.isFavorite = !friend.isFavorite;
      void this.showToast(
        friend.isFavorite
          ? this.t('myFriends.toast.addedFavorite')
          : this.t('myFriends.toast.removedFavorite'),
      );
    }
  }

  async openFriendActionsSheet(friend: Friend, ev: Event): Promise<void> {
    ev.stopPropagation();
    const bioPreview = friend.bio?.trim();
    const sheet = await this.actionSheetCtrl.create({
      header: friend.name,
      subHeader:
        bioPreview && bioPreview.length > 96
          ? `${bioPreview.slice(0, 96)}…`
          : bioPreview || undefined,
      buttons: [
        {
          text: this.t('myFriends.action.viewProfile'),
          handler: () => {
            this.openFriendProfile(friend);
          },
        },
        {
          text: friend.isFavorite
            ? this.t('myFriends.action.removeFavorite')
            : this.t('myFriends.action.addFavorite'),
          handler: () => {
            this.applyFavoriteToggle(friend.id);
          },
        },
        {
          text: friend.isBlocked
            ? this.t('myFriends.action.unblock')
            : this.t('myFriends.action.block'),
          role: friend.isBlocked ? undefined : 'destructive',
          handler: () => {
            void this.promptBlockToggle(friend);
          },
        },
        {
          text: this.t('myFriends.action.removeFriend'),
          role: 'destructive',
          handler: () => {
            void this.promptRemoveFriend(friend);
          },
        },
        { text: this.t('common.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async promptBlockToggle(friend: Friend): Promise<void> {
    if (friend.isBlocked) {
      friend.isBlocked = false;
      await this.showToast(this.t('myFriends.toast.unblocked'));
      return;
    }
    const alert = await this.alertController.create({
      header: this.t('myFriends.alert.blockTitle'),
      message: this.tParams('myFriends.alert.blockMessage', { name: friend.name }),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('myFriends.action.block'),
          role: 'destructive',
          handler: () => {
            friend.isBlocked = true;
            void this.showToast(this.t('myFriends.toast.blocked'));
          },
        },
      ],
    });
    await alert.present();
  }

  private async promptRemoveFriend(friend: Friend): Promise<void> {
    const alert = await this.alertController.create({
      header: this.t('myFriends.alert.removeTitle'),
      message: this.tParams('myFriends.alert.removeMessage', { name: friend.name }),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('myFriends.action.remove'),
          role: 'destructive',
          handler: () => {
            this.friends = this.friends.filter((f) => f.id !== friend.id);
            void this.showToast(this.t('myFriends.toast.removedFriend'));
          },
        },
      ],
    });
    await alert.present();
  }

  openFriendProfile(_friend: Friend): void {
    void this.router.navigate(['/profile']);
  }

  goInviteFriends(): void {
    void this.router.navigate(['/invite-friends']);
  }

  get filteredFriends(): Friend[] {
    let list = [...this.friends];

    if (this.selectedFilter === 'online') {
      list = list.filter((f) => f.status === 'online');
    } else if (this.selectedFilter === 'favorites') {
      list = list.filter((f) => f.isFavorite);
    } else if (this.selectedFilter === 'recent') {
      list.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') {
          return -1;
        }
        if (b.status === 'online' && a.status !== 'online') {
          return 1;
        }
        if (a.lastSeen && b.lastSeen) {
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        }
        return 0;
      });
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.bio?.toLowerCase().includes(q),
      );
    }

    return list;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'online':
        return 'var(--ion-color-success)';
      case 'away':
        return 'var(--ion-color-warning)';
      case 'offline':
        return 'var(--ion-color-medium)';
      default:
        return 'var(--ion-color-medium)';
    }
  }

  getStatusText(status: string, lastSeen?: string): string {
    switch (status) {
      case 'online':
        return this.t('myFriends.status.online');
      case 'away':
        return this.t('myFriends.status.away');
      case 'offline':
        return lastSeen
          ? this.tParams('myFriends.status.lastSeen', {
              time: this.formatRelativeTime(lastSeen),
            })
          : this.t('myFriends.status.offline');
      default:
        return this.t('myFriends.status.unknown');
    }
  }

  formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return diffDays === 1
          ? this.t('forums.time.yesterday')
          : this.tParams('forums.time.daysAgo', { days: diffDays });
      }
      if (diffHours > 0) {
        return diffHours === 1
          ? this.t('forums.time.oneHourAgo')
          : this.tParams('forums.time.hoursAgo', { hours: diffHours });
      }
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1
        ? this.t('forums.time.justNow')
        : this.tParams('forums.time.minutesAgo', { minutes: diffMinutes });
    } catch {
      return this.t('forums.time.recently');
    }
  }

  t(key: string): string {
    return this.translation.translate(key);
  }

  tParams(key: string, params: Record<string, string | number>): string {
    return this.translation.translateParams(key, params);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = 'assets/images/nurse.png';
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
