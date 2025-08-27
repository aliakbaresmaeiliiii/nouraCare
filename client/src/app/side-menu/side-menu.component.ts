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
  constructor() {}

  setActiveTop(index: number) {
    this.activeIndexTop = index;
  }

  setActiveBottom(item: any, index: number) {
    this.activeIndexBottom = index;
    if (item.label === 'Log Out') {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {}
}
