import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginComponent } from '../auth/login/login.component';
import { LanguageService } from '../shared/services/language.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, LoginComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('loginSection', { static: false }) loginSection!: ElementRef;
  private languageSubscription!: Subscription;

  constructor(
    private languageService: LanguageService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Listen to language changes to trigger updates
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(
      () => {
        // This will trigger change detection when language changes
      },
    );
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    console.log('Welcome component view initialized');
    console.log('Login section element:', this.loginSection);
    if (this.loginSection) {
      console.log('Login section found in ngAfterViewInit');
    } else {
      console.log('Login section NOT found in ngAfterViewInit');
    }
  }

  scrollToLogin() {
    console.log('Scroll to login clicked'); // Debug log
    console.log('Login section reference:', this.loginSection);

    if (this.loginSection && this.loginSection.nativeElement) {
      console.log('Login section found, scrolling...'); // Debug log
      this.loginSection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      console.log('Login section not found'); // Debug log
      // Try to find it manually
      const loginSection = document.querySelector('.login-section');
      console.log('Manual search for login section:', loginSection);
      if (loginSection) {
        loginSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  }

  testOnboarding() {
    this.router.navigate(['/onboarding']).then(
      (success) => console.log('Navigation successful:', success),
      (error) => console.error('Navigation failed:', error),
    );
  }
}
