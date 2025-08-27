import { AfterViewInit, Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { CirclePeriodChart } from '../shared/components/circle-period-chart/circle-period-chart';
import Swiper from 'swiper';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports:[SharedModule,CirclePeriodChart]
})
export class HomeComponent  implements OnInit,AfterViewInit {

  constructor() { }

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

  ngOnInit() {}


  tabChanged(){
  }

}
