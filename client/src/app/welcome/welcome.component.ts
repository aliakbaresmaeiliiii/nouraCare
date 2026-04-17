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
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginComponent } from '../auth/login/login.component';
import { LanguageService } from '../shared/services/language.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { PENDING_INVITE_CODE_KEY } from '../shared/constants/growth.constants';

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
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const ref = (params['ref'] || params['invite'] || '').trim();
      if (ref && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(PENDING_INVITE_CODE_KEY, ref.toUpperCase());
      }
    });

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
 
  }

  scrollToLogin() {
    if (this.loginSection && this.loginSection.nativeElement) {
      this.loginSection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      // Try to find it manually
      const loginSection = document.querySelector('.login-section');
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
      (success) => {},
      (error) => {},
    );
  }
}
