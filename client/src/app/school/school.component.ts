import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared-module';

@Component({
  selector: 'app-school',
  templateUrl: './school.component.html',
  styleUrls: ['./school.component.scss'],
  standalone: true,
  imports:[SharedModule],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class SchoolComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}
