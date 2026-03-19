import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  bulb,
  calendar,
  construct,
  home,
  menu,
  notifications,
  people,
  personCircle,
  school,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { LanguageService } from '../shared/services/language.service';
import { HomeComponent } from '../home/home.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS,HomeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LayoutComponent implements OnInit, OnDestroy {
  selectedTitle = 'Home';
  private languageSubscription!: Subscription;
  hasNotifications = true;
  hasUserAvatar = false;

  constructor(
    private router: Router,
    private languageService: LanguageService,
  ) {
    // Register the icons
    addIcons({
      home,
      construct,
      people,
      calendar,
      school,
      bulb,
      menu,
      notifications,
      personCircle,
    });
  }

  ngOnInit() {
    // Listen to route changes to update the title
    // this.router.events
    //   .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
    //   .subscribe((event) => {
    //     this.updateTitle(event?.url || '');
    //   });

    // Listen to language changes to update the title
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(
      () => {
        // Trigger change detection when language changes
        this.updateTitle(this.router.url);
      },
    );
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  private updateTitle(url: string) {
    if (url.includes('/tabs/home')) {
      this.selectedTitle = 'common.home';
    } else if (url.includes('/tabs/insights')) {
      this.selectedTitle = 'nav.insights';
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

  // New methods for the modern header
  // getPageIcon(): string {
  //   if (this.selectedTitle.includes('home')) return 'home-outline';
  //   if (this.selectedTitle.includes('insights')) return 'bulb-outline';
  //   if (this.selectedTitle.includes('SecretChats')) return 'people-outline';
  //   if (this.selectedTitle.includes('consultation')) return 'calendar-outline';
  //   if (this.selectedTitle.includes('school')) return 'school-outline';
  //   return 'home-outline';
  // }

  openNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  openProfile(): void {
    this.router.navigate(['/profile']);
  }
}
