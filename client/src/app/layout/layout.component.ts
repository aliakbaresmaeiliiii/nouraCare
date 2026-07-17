import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  bulb,
  bulbOutline,
  calendar,
  calendarOutline,
  construct,
  constructOutline,
  home,
  homeOutline,
  menuOutline,
  personCircleOutline,
  school,
  schoolOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ProfileCompletionService } from '../shared/services/profile-completion.service';
import {
  UserInfoStore,
  UserSessionService,
} from '../shared/services/user-session.service';
import { SideMenuComponent } from '../side-menu/side-menu.component';
@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, SideMenuComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly imageUrlService = inject(ImageUrlService);
  private readonly profileCompletion = inject(ProfileCompletionService);
  private readonly userSession = inject(UserSessionService);

  private routerSubscription?: Subscription;
  /** Resolved URL for `<img [src]>` when the user has a real profile photo (not the generic fallback). */
  headerAvatarSrc: string | null = null;
  hasUserAvatar = false;
  userInfoStore!: UserInfoStore;
  /** Soft Instagram-style chrome that blends with the Today hero gradient. */
  isHomeTab = false;

  constructor() {
    addIcons({
      home,
      homeOutline,
      construct,
      constructOutline,
      calendar,
      calendarOutline,
      school,
      schoolOutline,
      bulb,
      bulbOutline,
      menuOutline,
      personCircleOutline,
    });
  }

  ngOnInit() {
    this.loadHeaderProfile();
    this.syncHomeTabFlag(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.syncHomeTabFlag(e.urlAfterRedirects || e.url);
        this.applyHeaderFromUserStore();
      });
  }

  private syncHomeTabFlag(url: string): void {
    const path = url.split('?')[0] ?? '';
    this.isHomeTab = /\/tabs\/home(?:\/|$)/.test(path);
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  onHeaderAvatarError(): void {
    this.hasUserAvatar = false;
    this.headerAvatarSrc = null;
  }

  private loadHeaderProfile(): void {
    if (this.userInfoStore) {
      this.profileCompletion.refreshFromAPI().subscribe({
        next: (merged) => {
          if (!merged) {
            return;
          }
          const raw = (merged.profileImageRaw ?? '').toString().trim();
          if (raw) {
            this.hasUserAvatar = true;
            this.headerAvatarSrc = merged.profileImage;
          } else {
            this.hasUserAvatar = false;
            this.headerAvatarSrc = null;
          }
        },
      });
    } else {
      this.applyHeaderFromUserStore();
    }
  }

  /** Reads `userInfo.user` from storage (aligned with the side menu). */
  private applyHeaderFromUserStore(): void {
    try {
      this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
      const user = (this.userInfoStore.user ?? {}) as Record<string, unknown>;
      const profileImage = user['profileImage'] ?? user['profile_img'];
      const raw = typeof profileImage === 'string' ? profileImage.trim() : null;
      if (raw && !raw.startsWith('blob:') && !raw.startsWith('data:')) {
        this.hasUserAvatar = true;
        this.headerAvatarSrc = this.imageUrlService.getImageUrl(
          profileImage as string,
        );
      } else if (raw === '') {
        this.hasUserAvatar = false;
        this.headerAvatarSrc = null;
      }
    } catch (error) {
      console.error('Error loading header profile from storage:', error);
    }
  }

  /** Opens the read-only profile view; photo changes stay on `/edit-profile` only. */
  openProfile(): void {
    void this.router.navigate(['/profile']);
  }
}
