import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  home, 
  construct, 
  people, 
  calendar, 
  school 
} from 'ionicons/icons';
import { SharedModule } from '../shared/shared-module';
import { SideMenuComponent } from '../side-menu/side-menu.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports:[SharedModule, SideMenuComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class LayoutComponent implements OnInit {
  paletteToggle = false;
  selectedTitle = 'Home';

  constructor(private router: Router) {
    // Register the icons
    addIcons({ home, construct, people, calendar, school });
  }

  ngOnInit() {
    // Listen to route changes to update the title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateTitle(event.url);
    });
  }

  toggleChange(event: any) {
    this.paletteToggle = event.detail.checked;
  }

  private updateTitle(url: string) {
    if (url.includes('/tabs/home')) {
      this.selectedTitle = 'Home';
    } else if (url.includes('/tabs/tools')) {
      this.selectedTitle = 'Health Tools';
    } else if (url.includes('/tabs/social')) {
      this.selectedTitle = 'Social Media';
    } else if (url.includes('/tabs/consultation')) {
      this.selectedTitle = 'Schedule Consultation';
    } else if (url.includes('/tabs/school')) {
      this.selectedTitle = 'Pregnancy School';
    } else {
      this.selectedTitle = 'Home';
    }
  }
}
