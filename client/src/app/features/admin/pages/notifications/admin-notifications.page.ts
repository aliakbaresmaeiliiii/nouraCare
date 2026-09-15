import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import { AdminNotificationsService } from '../../data/services/admin-notifications.service';

@Component({
  selector: 'app-admin-notifications-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './admin-notifications.page.html',
  styleUrl: './admin-notifications.page.scss',
})
export class AdminNotificationsPage {
  private readonly notif = inject(AdminNotificationsService);
  private readonly language = inject(LanguageService);

  readonly items = this.notif.items;
  readonly lang = toSignal(this.language.currentLanguage$, {
    initialValue: this.language.getCurrentLanguage(),
  });

  markAll(): void {
    this.notif.markAllRead();
  }

  markOne(id: string): void {
    this.notif.markRead(id);
  }

  relative(iso: string): string {
    return this.notif.relativeTime(iso, this.lang() || 'fa');
  }
}
