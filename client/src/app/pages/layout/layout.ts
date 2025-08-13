import { AfterViewInit, Component, inject } from '@angular/core';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout implements  AfterViewInit{
  activeIndexTop: number | null = null;
  activeIndexBottom: number | null = null;

  
  menuItemsTop = [
    { icon: 'heart-outline', label: 'Gahvareh Pro' },
    { icon: 'list-outline', label: 'My Purchase' },
    { icon: 'heart-outline', label: 'My Favorite Product' },
    { icon: 'bookmark-outline', label: 'Save Information' },
    { icon: 'people-outline', label: 'My Friends' },
    { icon: 'people-circle-outline', label: 'Forums' },
    { icon: 'ban-outline', label: 'Blocks' },
  ];

  menuItemsBottom = [
    { icon: 'logo-wechat', label: 'Services' },
    { icon: 'sync-outline', label: 'Update' },
    { icon: 'person-add-outline', label: 'Invite Friends' },
    { icon: 'notifications-outline', label: 'Notifications Setting' },
    { icon: 'alert-circle-outline', label: 'About Gahvareh' },
    { icon: 'log-in-outline', label: 'Log Out' },
  ];

  ngAfterViewInit(): void {
  }

  setActiveTop(index: number) {
    this.activeIndexTop = index;
  }

  setActiveBottom(index: number) {
    this.activeIndexBottom = index;
  }
}
