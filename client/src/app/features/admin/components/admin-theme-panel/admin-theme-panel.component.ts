import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import {
  AdminAccent,
  AdminLayoutMode,
} from '../../data/models/admin.models';
import { AdminThemeService } from '../../data/services/admin-theme.service';

@Component({
  selector: 'app-admin-theme-panel',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './admin-theme-panel.component.html',
  styleUrl: './admin-theme-panel.component.scss',
})
export class AdminThemePanelComponent {
  readonly themeSvc = inject(AdminThemeService);
  private readonly language = inject(LanguageService);

  readonly currentLang = toSignal(this.language.currentLanguage$, {
    initialValue: this.language.getCurrentLanguage(),
  });

  readonly accents: { id: AdminAccent; color: string }[] = [
    { id: 'violet', color: '#6366f1' }, // brand primary
    { id: 'blue', color: '#2563eb' },
    { id: 'green', color: '#14b8a6' }, // brand secondary
    { id: 'orange', color: '#f97316' },
    { id: 'slate', color: '#0f172a' },
  ];

  readonly layouts: { id: AdminLayoutMode; labelKey: string }[] = [
    { id: 'default', labelKey: 'admin.theme.layoutDefault' },
    { id: 'boxed', labelKey: 'admin.theme.layoutBoxed' },
    { id: 'compact', labelKey: 'admin.theme.layoutCompact' },
  ];

  close(): void {
    this.themeSvc.closeThemePanel();
  }

  setDark(on: boolean): void {
    this.themeSvc.set(on ? 'dark' : 'light');
  }

  setDir(dir: 'rtl' | 'ltr'): void {
    this.themeSvc.setDirection(dir);
  }

  setAccent(accent: AdminAccent): void {
    this.themeSvc.setAccent(accent);
  }

  setLayout(layout: AdminLayoutMode): void {
    this.themeSvc.setLayout(layout);
  }

  isRtl(): boolean {
    return this.currentLang() === 'fa';
  }
}
