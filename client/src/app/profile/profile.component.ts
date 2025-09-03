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


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [SharedModule],
  styleUrls: ['./profile.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileComponent implements OnInit, ViewWillEnter {
  percent: number = 0;
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

  shareProfile() {
    // Logic to share profile
    console.log('Sharing profile...');
    // You can implement native sharing or custom share dialog here
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
      this.computeProgress();
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
    } catch {}
    
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
        
        this.computeProgress();
      });
    } else {
      this.computeProgress();
    }
  }

  private computeProgress() {
    // Calculate progress based on all profile fields from edit profile form
    const profileFields = [
      { value: this.name, weight: 20 },           // Name - 20%
      { value: this.email, weight: 20 },          // Email - 20%
      { value: this.birthday, weight: 15 },       // Birthday - 15%
      { value: this.profileImage, weight: 15 },   // Profile Image - 15%
      // Additional fields from edit profile that we can check
      { value: this.userInfoStore?.user?.status, weight: 10 },           // Status - 10%
      { value: this.userInfoStore?.user?.menstrualCycleLength, weight: 5 }, // Cycle Length - 5%
      { value: this.userInfoStore?.user?.periodDuration, weight: 5 },     // Period Duration - 5%
      { value: this.userInfoStore?.user?.lastPeriodStartDate, weight: 10 }  // Last Period Start - 10%
    ];

    let totalProgress = 0;
    let totalWeight = 0;

    profileFields.forEach(field => {
      totalWeight += field.weight;
      if (field.value && field.value !== '' && field.value !== null && field.value !== undefined) {
        totalProgress += field.weight;
      }
    });

    this.percent = Math.round((totalProgress / totalWeight) * 100);
    console.log('Profile completion:', this.percent + '%', {
      name: this.name,
      email: this.email,
      birthday: this.birthday,
      profileImage: this.profileImage,
      status: this.userInfoStore?.user?.status,
      cycleLength: this.userInfoStore?.user?.menstrualCycleLength,
      periodDuration: this.userInfoStore?.user?.periodDuration,
      lastPeriodStart: this.userInfoStore?.user?.lastPeriodStartDate
    });
  }
}
