import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  imports: [SharedModule],
})
export class SideMenuComponent implements OnInit {
  activeIndexTop: number | null = null;
  activeIndexBottom: number | null = null;
  router = inject(Router);

  // User profile data
  userName: string = 'Aliakbar Esmaeili';
  userProfileImage: string | null = null;
  profileCompletion: number = 30;

  // App version
  appVersion: string = '1.0.0';

  menuItemsTop = [
    { icon: 'diamond-outline', label: 'Gahvareh Pro', badge: 'PRO' },
    { icon: 'bag-outline', label: 'My Purchases' },
    { icon: 'heart-outline', label: 'My Favorites' },
    { icon: 'bookmark-outline', label: 'Saved Information' },
    { icon: 'people-outline', label: 'My Friends' },
    { icon: 'chatbubbles-outline', label: 'Forums' },
    { icon: 'ban-outline', label: 'Blocked Users' },
  ];

  menuItemsBottom = [
    { icon: 'settings-outline', label: 'Settings' },
    { icon: 'refresh-outline', label: 'Check for Updates' },
    { icon: 'person-add-outline', label: 'Invite Friends' },
    { icon: 'notifications-outline', label: 'Notifications' },
    { icon: 'information-circle-outline', label: 'About Gahvareh' },
    { icon: 'log-out-outline', label: 'Log Out' },
  ];

  constructor() {}

  setActiveTop(index: number) {
    this.activeIndexTop = index;
    // Add navigation logic here if needed
  }

  setActiveBottom(item: any, index: number) {
    this.activeIndexBottom = index;
    if (item.label === 'Log Out') {
      this.logout();
    }
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
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      this.userName = profile.name || this.userName;
      this.userProfileImage = profile.profileImage || null;
      this.profileCompletion = profile.completion || this.profileCompletion;
    }
  }
}
