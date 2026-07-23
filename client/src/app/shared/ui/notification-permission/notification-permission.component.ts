import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-notification-permission',
  templateUrl: './notification-permission.component.html',
  styleUrls: ['./notification-permission.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe]
})
export class NotificationPermissionComponent implements OnInit {
  enableNotifications: boolean = false;

  constructor() {}

  ngOnInit() {}

  onToggleChange() {
    // Handle toggle change if needed
  }

  savePreference() {
    // Save the user's preference
    // Here you would typically:
    // 1. Save the preference to local storage or backend
    // 2. Request notification permission if enabled
    // 3. Navigate away or close the modal
    if (this.enableNotifications) {
      // Add notification permission request logic here
    }
  }
}
