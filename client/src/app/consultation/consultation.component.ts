import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared-module';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss'],
  standalone: true,
  imports:[SharedModule],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class ConsultationComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}
