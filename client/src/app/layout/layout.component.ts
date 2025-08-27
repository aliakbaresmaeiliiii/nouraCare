import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { MenuController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personCircle,
  personCircleOutline,
  sunny,
  sunnyOutline,
  library,
  playCircle,
  radio,
  search
} from 'ionicons/icons';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [SharedModule, SideMenuComponent],
})
export class LayoutComponent implements OnInit {
  selectedTitle = 'Home';
  paletteToggle = false;
  constructor(private menuCtrl: MenuController) {
    addIcons({ personCircle, personCircleOutline, sunny, sunnyOutline ,library, playCircle, radio, search });
  }

  openMenu() {
    this.menuCtrl.open('main-menu');
  }

  tabChanged(event: any) {
    switch (event.tab) {
      case 'home':
        this.selectedTitle = 'Home';
        break;
      case 'tools':
        this.selectedTitle = 'Tools';
        break;
      case 'library':
        this.selectedTitle = 'Library';
        break;
      case 'search':
        this.selectedTitle = 'Search';
        break;
    }
  }
  ngOnInit() {
    // Use matchMedia to check the user preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // Initialize the dark palette based on the initial
    // value of the prefers-color-scheme media query
    this.initializeDarkPalette(prefersDark.matches);

    // Listen for changes to the prefers-color-scheme media query
    prefersDark.addEventListener('change', (mediaQuery) =>
      this.initializeDarkPalette(mediaQuery.matches)
    );
  }

  // Check/uncheck the toggle and update the palette based on isDark
  initializeDarkPalette(isDark: boolean) {
    this.paletteToggle = isDark;
    this.toggleDarkPalette(isDark);
  }

  // Listen for the toggle check/uncheck to toggle the dark palette
  toggleChange(event: CustomEvent) {
    this.toggleDarkPalette(event.detail.checked);
  }

  // Add or remove the "ion-palette-dark" class on the html element
  toggleDarkPalette(shouldAdd: boolean) {
    document.documentElement.classList.toggle('ion-palette-dark', shouldAdd);
  }
}
