import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import Swiper from 'swiper';
import { AuthModule } from '../../auth/auth.module';
import { Login } from '../../auth/components/login/login';

@Component({
  selector: 'app-welcome',
  imports: [IonContent, AuthModule, Login],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Welcome {
  cdr = inject(ChangeDetectorRef);
  spaceBetween = 10;
  interval: any;

  onProgress(event: CustomEvent<[Swiper, number]>) {
    const [swiper, progress] = event.detail;
    console.log(progress);
  }

  onSlideChange() {
    console.log('slide changed');
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (platformId === 'browser') {
      console.log('Running in the browser');
    } else {
      console.log('Running on the server');
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const swiper = new Swiper('.swiper', {
        // Optional parameters
        loop: true,

        // If we need pagination
        pagination: {
          el: '.swiper-pagination',
        },

        // Navigation arrows
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        
      });
      this.cdr.detectChanges();
    }
  }

}

