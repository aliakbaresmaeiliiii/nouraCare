import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
} from '@angular/core';
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
export class ProfileComponent implements OnInit {
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

  ngOnInit(): void {
    this.percent = 80;
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
        this.computeProgress();
      });
    }
    this.computeProgress();
  }

  private computeProgress() {
    const fields = [this.name, this.email, this.birthday, this.city];
    const filled = fields.filter((v) => !!v).length;
    this.percent = Math.round((filled / fields.length) * 100);
  }
}
