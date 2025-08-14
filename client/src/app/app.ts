import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Login } from './auth/components/login/login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonRouterOutlet, IonApp],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  loginComponent = Login;
}
