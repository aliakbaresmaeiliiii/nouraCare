import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
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
import { HeaderLanguageSwitcherComponent } from '../shared/components/header-language-switcher/header-language-switcher.component';
import { LanguageService } from '../shared/services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports:[SharedModule, SideMenuComponent, HeaderLanguageSwitcherComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class LayoutComponent implements OnInit, OnDestroy {
  paletteToggle = false;
  selectedTitle = 'Home';
  private languageSubscription!: Subscription;

  constructor(
    private router: Router,
    private languageService: LanguageService
  ) {
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

    // Listen to language changes to update the title
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      // Trigger change detection when language changes
      this.updateTitle(this.router.url);
    });
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  toggleChange(event: any) {
    this.paletteToggle = event.detail.checked;
  }

  private updateTitle(url: string) {
    if (url.includes('/tabs/home')) {
      this.selectedTitle = 'common.home';
    } else if (url.includes('/tabs/tools')) {
      this.selectedTitle = 'nav.tools';
    } else if (url.includes('/tabs/SecretChats')) {
      this.selectedTitle = 'nav.SecretChats';
    } else if (url.includes('/tabs/consultation')) {
      this.selectedTitle = 'nav.consultation';
    } else if (url.includes('/tabs/school')) {
      this.selectedTitle = 'nav.school';
    } else {
      this.selectedTitle = 'common.home';
    }
  }
}
