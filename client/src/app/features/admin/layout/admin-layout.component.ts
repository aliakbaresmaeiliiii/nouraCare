import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import { AdminSidebarComponent } from '../components/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../components/admin-topbar/admin-topbar.component';
import { AdminFooterComponent } from '../components/admin-footer/admin-footer.component';
import { AdminToastHostComponent } from '../components/admin-toast-host/admin-toast-host.component';
import { AdminThemePanelComponent } from '../components/admin-theme-panel/admin-theme-panel.component';
import { AdminShellService } from '../data/services/admin-shell.service';
import { AdminThemeService } from '../data/services/admin-theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    TranslatePipe,
    AdminSidebarComponent,
    AdminTopbarComponent,
    AdminFooterComponent,
    AdminToastHostComponent,
    AdminThemePanelComponent,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  readonly shell = inject(AdminShellService);
  readonly themeSvc = inject(AdminThemeService);
  private readonly language = inject(LanguageService);

  readonly currentLang = toSignal(this.language.currentLanguage$, {
    initialValue: this.language.getCurrentLanguage(),
  });

  dir(): 'rtl' | 'ltr' {
    const code = this.currentLang();
    return code === 'fa' || code === 'ar' || code === 'he' ? 'rtl' : 'ltr';
  }
}
