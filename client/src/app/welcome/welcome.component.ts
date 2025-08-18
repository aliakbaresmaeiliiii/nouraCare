import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { IonContent, IonRouterOutlet } from '@ionic/angular/standalone';
import { LoginComponent } from '../auth/login/login.component';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  imports: [IonContent, LoginComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
