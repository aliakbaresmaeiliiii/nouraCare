import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  cellularOutline,
  cloudOfflineOutline,
  refreshOutline,
  wifiOutline,
} from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { ConnectivityService } from '../shared/services/connectivity.service';

@Component({
  selector: 'app-offline-page',
  templateUrl: './offline-page.component.html',
  styleUrl: './offline-page.component.scss',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class OfflinePageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly connectivity = inject(ConnectivityService);

  toastOpen = false;
  toastMessage = '';
  retrying = false;

  constructor() {
    addIcons({
      cloudOfflineOutline,
      wifiOutline,
      cellularOutline,
      refreshOutline,
    });
  }

  ngOnInit(): void {
    this.connectivity.resetReturnNavigationLock();
  }

  tryAgain(): void {
    this.retrying = true;
    queueMicrotask(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this.goBackOnline();
        this.retrying = false;
        return;
      }
      this.showToastKey('offline.stillOffline');
      this.retrying = false;
    });
  }

  private goBackOnline(): void {
    this.connectivity.navigateAwayFromOfflineIfNeeded();
  }

  private showToastKey(key: string): void {
    this.toastMessage = key;
    this.toastOpen = true;
  }

  onToastDismiss(): void {
    this.toastOpen = false;
  }
}
