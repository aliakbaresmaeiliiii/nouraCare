import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { SharedModule } from '../shared/shared-module';
import Swiper from 'swiper';
import { Router } from '@angular/router';
import { User } from '../shared/services/user';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ProfileCompletionService } from '../shared/services/profile-completion.service';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [SharedModule],
  styleUrls: ['./profile.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileComponent implements OnInit, ViewWillEnter {
  // Use the service's computed signal for percent
  get percent(): number {
    const completion = this.profileCompletionService.profileCompletion();
    return completion;
  }
  selectedTab = 'first';
  // swiperEl = viewChild('swiperContainer');
  router = inject(Router);
  userInfoStore: any = {};
  name: string = '';
  email: string = '';
  birthday: string = '';
  city: string = '';
  profileImage: string | null = null;
  private userService = inject(User);
  private imageUrlService = inject(ImageUrlService);
  private profileCompletionService = inject(ProfileCompletionService);
  
  userInfo = signal<any[]>([
    {
      friends: 20,
      Question: 50,
      Answers: 30,
      Benefits: 40,
    },
  ]);

  isShowBtn = false;
  title = '';
  currentSlide: number = 1;
  dotHelper: Array<Number> = [];

  // @ViewChild('sliderRef') sliderRef!: ElementRef<HTMLElement>;

  ngAfterViewInit() {
    var swiper = new Swiper('.mySwiper', {
      slidesPerView: 3,
      spaceBetween: 10,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
    });
  }

  segmentChanged(ev: any) {
    this.selectedTab = ev.detail.value;
  }

  someFunction() {}

  editProfile() {
    // Logic to edit profile
    this.router.navigate(['/profile-edit']);
  }

  goEdit(field: string) {
    this.router.navigate(['/profile-edit'], { queryParams: { focus: field } });
  }

  async shareProfile() {
    try {
      // Create share data
      const shareData = {
        title: 'My Profile - Gahvareh',
        text: `Check out my profile on Gahvareh! I'm ${this.name || 'a user'} and my profile is ${this.percent}% complete.`,
        url: window.location.href, // Share the current profile page URL
      };

      // Try to use native Web Share API
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        console.log('Profile shared successfully using native share');
      } else {
        // Fallback: Copy to clipboard and show alert
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await this.copyToClipboard(shareText);
        this.showShareSuccessAlert();
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
      // Fallback: Copy to clipboard
      try {
        const fallbackText = `My Profile - Gahvareh\nCheck out my profile: ${window.location.href}`;
        await this.copyToClipboard(fallbackText);
        this.showShareSuccessAlert();
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        this.showShareErrorAlert();
      }
    }
  }

  private async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  private showShareSuccessAlert() {
    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    alert.innerHTML = `✅ Profile link copied to clipboard!`;
    document.body.appendChild(alert);

    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 3000);
  }

  private showShareErrorAlert() {
    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    alert.innerHTML = `❌ Failed to share profile. Please try again.`;
    document.body.appendChild(alert);

    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 3000);
  }

  // Method to refresh profile data and progress when returning from edit profile
  refreshProfileData() {
    try {
      this.userInfoStore = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const u = this.userInfoStore?.user || {};
      this.name = u.name || '';
      this.email = u.email || '';
      this.birthday = u.birthday || '';
      this.city = u.city || '';
      this.profileImage = this.imageUrlService.getImageUrl(u.profileImage);
      // Don't update service here - let ngOnInit handle it with API data
    } catch {}
  }

  ionViewWillEnter(): void {
    // Refresh profile data when entering the page
    this.refreshProfileData();
  }

    ngOnInit(): void {
    try {
      this.userInfoStore = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const u = this.userInfoStore?.user || {};
      this.name = u.name || '';
      this.email = u.email || '';
      this.birthday = u.birthday || '';
      this.city = u.city || '';
      this.profileImage = this.imageUrlService.getImageUrl(u.profileImage);
      // Don't initialize service here - wait for API data
    } catch (error) {
      console.error('ProfileComponent - Error loading from localStorage:', error);
    }
    
    // fetch fresh from API if we have id
    const id = this.userInfoStore?.user?.id;
    if (id) {
      this.userService.getUser(String(id)).subscribe((res: any) => {
        this.name = res?.name || this.name;
        this.email = res?.email || this.email;
        this.birthday = res?.birthday || this.birthday;
        this.city = res?.city || this.city;
        this.profileImage = this.imageUrlService.getImageUrl(res?.profileImage || this.profileImage);

        // Update userInfoStore with fresh data for progress calculation
        if (res) {
          this.userInfoStore.user = {
            ...this.userInfoStore.user,
            ...res
          };
        }
        
        // Update the service with fresh data from API
        this.profileCompletionService.updateUserData(this.userInfoStore.user);
      });
    } else {
      // Only update service if no API call is made
      this.profileCompletionService.updateUserData(this.userInfoStore?.user || {});
    }
  }
}




