import { Component, inject, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoInstagram, paperPlaneOutline } from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ProfileCompletionService } from '../shared/services/profile-completion.service';
import { AuthService } from '../auth/services/auth';
import { UserSessionService } from '../shared/services/user-session.service';

interface MenuItem {
  icon: string;
  label: string;
  badge?: string;
}

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class SideMenuComponent implements OnInit, ViewWillEnter {
  activeIndexTop: number | null = null;
  activeIndexBottom: number | null = null;
  router = inject(Router);
  private imageUrlService = inject(ImageUrlService);
  private profileCompletionService = inject(ProfileCompletionService);
  private authService = inject(AuthService);
  private userSession = inject(UserSessionService);

  // User profile data
  userName: string = 'Aliakbar Esmaeili';
  userProfileImage: string | null = null;
  // Use the service's computed signal for profile completion
  get profileCompletion(): number {
    return this.profileCompletionService.profileCompletion();
  }

  // App version
  appVersion: string = '1.0.0';

  menuItemsTop: MenuItem[] = [
    { icon: 'diamond-outline', label: 'menu.muslimKidsPro', badge: 'PRO' },
    { icon: 'bag-outline', label: 'menu.myPurchases' },
    { icon: 'heart-outline', label: 'menu.myFavorites' },
    { icon: 'bookmark-outline', label: 'menu.savedInformation' },
    { icon: 'people-outline', label: 'menu.myFriends' },
    { icon: 'chatbubbles-outline', label: 'menu.forums' },
    { icon: 'ban-outline', label: 'menu.blockedUsers' },
  ];

  menuItemsBottom: MenuItem[] = [
    { icon: 'settings-outline', label: 'menu.settings' },
    { icon: 'refresh-outline', label: 'menu.checkUpdates' },
    { icon: 'person-add-outline', label: 'menu.inviteFriends' },
    { icon: 'notifications-outline', label: 'menu.notifications' },
    { icon: 'information-circle-outline', label: 'menu.aboutMuslimKids' },
    { icon: 'log-out-outline', label: 'menu.logOut' },
  ];

  constructor() {
    addIcons({ logoInstagram, paperPlaneOutline });
  }

  async setActiveTop(index: number) {
    this.activeIndexTop = index;
    
    // Get the menu item
    const item = this.menuItemsTop[index];
    
    // Add navigation logic for specific menu items
    if (item.label === 'menu.myFavorites') {
      await this.router.navigate(['/my-favorites']);
    } else if (item.label === 'menu.blockedUsers') {
      await this.router.navigate(['/blocked-users']);
    } else if (item.label === 'menu.savedInformation') {
      await this.router.navigate(['/saved-information']);
    } else if (item.label === 'menu.myFriends') {
      await this.router.navigate(['/my-friends']);
    } else if (item.label === 'menu.forums') {
      await this.router.navigate(['/forums']);
    }
    // Add more navigation logic for other menu items as needed
  }

  async setActiveBottom(item: MenuItem, index: number) {
    this.activeIndexBottom = index;
    if (item.label === 'menu.logOut') {
      this.logout();
    } else if (item.label === 'menu.aboutMuslimKids') {
      await this.router.navigate(['/tabs/about']);
    } else if (item.label === 'menu.checkUpdates') {
      await this.router.navigate(['/check-version']);
    } else if (item.label === 'menu.settings') {
      await this.router.navigate(['/settings']);
    } else if (item.label === 'menu.inviteFriends') {
      await this.router.navigate(['/invite-friends']);
    } else if (item.label === 'menu.notifications') {
      await this.router.navigate(['/notifications']);
    }
  }

  async navigateToProfile() {
    await this.router.navigate(['/profile']);
  }

  logout() {
    // Call the AuthService logout method to properly clear tokens and authentication state
    this.authService.logout();
  }

  openSocialLink(platform: string) {
    const socialLinks = {
      instagram: 'https://instagram.com/muslimkids',
      telegram: 'https://t.me/muslimkids'
    };
    
    if (socialLinks[platform as keyof typeof socialLinks]) {
      window.open(socialLinks[platform as keyof typeof socialLinks], '_blank');
    }
  }

  ngOnInit() {
    // Load user profile data
    this.loadUserProfile();
  }

  ionViewWillEnter(): void {
    // Refresh profile data from API when entering the page
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.profileCompletionService.refreshFromAPI().subscribe({
      next: (merged) => {
        if (merged) {
          this.userName = merged.fullName || merged.name || this.userName;
          // Same resolved URL as profile page (absolute API URLs unchanged).
          this.userProfileImage = merged.profileImage;
        }
      },
    });

    try {
      const userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
      const user = (userInfoStore.user ?? {}) as Record<string, unknown>;
      const fullName = user['fullName'];
      const name = user['name'];
      this.userName =
        (typeof fullName === 'string' && fullName) ||
        (typeof name === 'string' && name) ||
        this.userName;
      const profileImage = user['profileImage'];
      this.userProfileImage =
        this.userProfileImage ||
        this.imageUrlService.getImageUrl(
          typeof profileImage === 'string' ? profileImage : null,
        );
    } catch (error) {
      console.error('Error loading user profile from localStorage:', error);
    }
  }
}
