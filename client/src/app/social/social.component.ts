import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared-module';

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss'],
  standalone: true,
  imports:[SharedModule],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class SocialComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}
