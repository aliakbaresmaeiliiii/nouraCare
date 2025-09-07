import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { UserInfoService } from './shared/services/user-info.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private userInfoService = inject(UserInfoService);

  constructor() {
    // Initialize user info service on app start
    this.userInfoService.loadUserInfoOnInit();
  }
}
