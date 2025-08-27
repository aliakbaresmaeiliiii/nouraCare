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
  ngOnInit(): void {
    this.percent = 80;
  }
}
