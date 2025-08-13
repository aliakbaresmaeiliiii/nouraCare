import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  create,
  ellipsisHorizontal,
  helpCircle,
  library,
  personCircle,
  playCircle,
  radio,
  search,
  star,
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit{
  constructor() {
    
    this.insertIcon();
  }

  ngOnInit(): void {
  }

  insertIcon(){
    addIcons({
      library,
      playCircle,
      radio,
      search,
      create,
      ellipsisHorizontal,
      helpCircle,
      personCircle,
      star,
    });
  }
  ngOnDestroy() {
  }
}
