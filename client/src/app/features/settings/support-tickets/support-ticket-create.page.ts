import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline } from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import {
  SupportTicketCategory,
  SupportTicketService,
} from '@app/shared/services/support-ticket.service';
import { TranslationService } from '@app/shared/services/translation.service';

const CATEGORIES: SupportTicketCategory[] = [
  'QUESTION',
  'BUG',
  'ACCOUNT',
  'PAYMENT',
  'FEEDBACK',
  'OTHER',
];

@Component({
  selector: 'app-support-ticket-create',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, FormsModule],
  templateUrl: './support-ticket-create.page.html',
  styleUrls: ['./support-ticket-create.page.scss'],
  host: { class: 'ion-page' },
})
export class SupportTicketCreatePage implements OnInit {
  private readonly api = inject(SupportTicketService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastCtrl = inject(ToastController);
  private readonly i18n = inject(TranslationService);

  readonly categories = CATEGORIES;
  readonly submitting = signal(false);

  category: SupportTicketCategory = 'QUESTION';
  subject = '';
  message = '';

  constructor() {
    addIcons({ sendOutline });
  }

  ngOnInit(): void {
    const preset = this.route.snapshot.queryParamMap.get('category');
    if (preset && CATEGORIES.includes(preset as SupportTicketCategory)) {
      this.category = preset as SupportTicketCategory;
    }
    if (preset === 'FEEDBACK' && !this.subject.trim()) {
      this.subject = this.i18n.translate('settings.feedback.title');
    }
  }

  goBack(): void {
    void this.router.navigate(['/help-support']);
  }

  categoryKey(category: string): string {
    return `support.category.${category}`;
  }

  async submit(): Promise<void> {
    const subject = this.subject.trim();
    const message = this.message.trim();
    if (subject.length < 3 || message.length < 10) {
      await this.toast(this.i18n.translate('support.create.validation'), 'warning');
      return;
    }
    if (this.submitting()) return;

    this.submitting.set(true);
    this.api
      .create({
        subject,
        message,
        category: this.category,
        appVersion: this.detectAppVersion(),
        deviceInfo: this.detectDevice(),
        pagePath: '/support-tickets/new',
      })
      .subscribe({
        next: async (ticket) => {
          this.submitting.set(false);
          await this.toast(this.i18n.translate('support.create.success'), 'success');
          void this.router.navigate(['/support-tickets', ticket.id], {
            replaceUrl: true,
          });
        },
        error: async () => {
          this.submitting.set(false);
          await this.toast(this.i18n.translate('support.create.error'), 'danger');
        },
      });
  }

  private detectAppVersion(): string {
    try {
      const w = window as Window & { __APP_VERSION__?: string };
      return w.__APP_VERSION__ || 'web';
    } catch {
      return 'web';
    }
  }

  private detectDevice(): string {
    try {
      const ua = navigator.userAgent || '';
      return ua.slice(0, 240);
    } catch {
      return '';
    }
  }

  private async toast(
    message: string,
    color: 'success' | 'danger' | 'warning',
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2600,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
