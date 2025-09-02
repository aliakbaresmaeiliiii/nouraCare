import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';
import { ImageUrlService } from '../shared/services/image-url.service';

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
export class SideMenuComponent implements OnInit {
  activeIndexTop: number | null = null;
  activeIndexBottom: number | null = null;
  router = inject(Router);
  private imageUrlService = inject(ImageUrlService);

  // User profile data
  userName: string = 'Aliakbar Esmaeili';
  userProfileImage: string | null = null;
  profileCompletion: number = 30;

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

  setActiveTop(index: number) {
    this.activeIndexTop = index;
    // Add navigation logic here if needed
  }

  async setActiveBottom(item: MenuItem, index: number) {
    this.activeIndexBottom = index;
    if (item.label === 'menu.logOut') {
      this.logout();
    } else if (item.label === 'menu.aboutGahvareh') {
      await this.router.navigate(['/tabs/about']);
    }
  }

  async navigateToProfile() {
    await this.router.navigate(['/profile']);
  }

  logout() {
    // Add logout logic here
    this.router.navigate(['/']);
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

  private loadUserProfile() {
    // Load user profile from localStorage or service
    try {
      const userInfoStore = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const user = userInfoStore?.user || {};
      this.userName = user.name || this.userName;
      this.userProfileImage = this.imageUrlService.getImageUrl(user.profileImage);
      
      // Calculate profile completion based on filled fields
      const fields = [user.name, user.email, user.birthday, user.city];
      const filled = fields.filter((v) => !!v).length;
      this.profileCompletion = Math.round((filled / fields.length) * 100);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }
}
