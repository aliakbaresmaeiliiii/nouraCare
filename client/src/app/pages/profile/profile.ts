import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewChild,
  viewChild,
} from '@angular/core';
import KeenSlider, { KeenSliderInstance } from 'keen-slider';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrls: [
    '../../../../node_modules/keen-slider/keen-slider.min.css',
    './profile.scss',
  ],
})
export class Profile implements OnInit, AfterViewInit {
  percent: number = 0;
  cdr = inject(ChangeDetectorRef);
  selectedTab = 'first';
  swiperEl = viewChild('swiperContainer');

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

  @ViewChild('sliderRef') sliderRef!: ElementRef<HTMLElement>;
  slider: KeenSliderInstance | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Check if the platform is browser
    if (this.platformId === 'browser') {
      // Perform browser-specific logic here
      console.log('Running in the browser');
    } else {
      console.log('Not running in the browser');
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.slider = new KeenSlider(this.sliderRef.nativeElement, {
        slides: {
          perView: 3,
          spacing: 8,
        },
        breakpoints: {
          '(min-width:768px)': {
            slides: { perView: 3, spacing: 12 },
          },
          '(max-width:480px)': {
            slides: { perView: 3, spacing: 25 },
          },
          '(min-width: 1024px)': {
            slides: { perView: 4, spacing: 16 },
          },
        },
      });
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (this.slider) {
      this.slider.update();
    }
  }

  segmentChanged(ev: any) {
    this.selectedTab = ev.detail.value;
  }

  ngOnDestroy() {
    if (this.slider) this.slider.destroy();
  }

  ngOnInit(): void {
    this.percent = 50;
  }
}
