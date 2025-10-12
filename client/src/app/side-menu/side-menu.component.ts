import { Component, inject, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ProfileCompletionService } from '../shared/services/profile-completion.service';
import { AuthService } from '../auth/services/auth';

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
  imports: [SharedModule],
})
export class SideMenuComponent implements OnInit, ViewWillEnter {
  activeIndexTop: number | null = null;
  activeIndexBottom: number | null = null;
  router = inject(Router);
  private imageUrlService = inject(ImageUrlService);
  private profileCompletionService = inject(ProfileCompletionService);
  private authService = inject(AuthService);

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
    { icon: 'diamond-outline', label: 'menu.gahvarehPro', badge: 'PRO' },
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
    { icon: 'information-circle-outline', label: 'menu.aboutGahvareh' },
    { icon: 'log-out-outline', label: 'menu.logOut' },
  ];

  constructor() {}

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
    } else if (item.label === 'menu.aboutGahvareh') {
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
      instagram: 'https://instagram.com/gahvareh',
      telegram: 'https://t.me/gahvareh'
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
    // Load user profile from API
    this.profileCompletionService.refreshFromAPI();
    
    // Also try to get basic user info from localStorage for immediate display
    try {
      const userInfoStore = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const user = userInfoStore?.user || {};
      this.userName = user.name || this.userName;
      this.userProfileImage = this.imageUrlService.getImageUrl(user.profileImage);
    } catch (error) {
      console.error('Error loading user profile from localStorage:', error);
    }
  }
}
