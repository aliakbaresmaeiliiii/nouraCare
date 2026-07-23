import { AfterViewInit, Component, inject } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { ThemeService } from '@app/shared/services/theme.service';
import { PwaInstallBannerComponent } from '@app/shared/ui/pwa-install-banner/pwa-install-banner.component';

/**
 * Root shell. `ion-app` exists after first render; palette class must live on it for Ionic dark CSS.
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  imports: [...SHARED_STANDALONE_IMPORTS, PwaInstallBannerComponent],
})
export class AppComponent implements AfterViewInit {
  private readonly themeService = inject(ThemeService);

  ngAfterViewInit(): void {
    this.themeService.init();
  }
}
