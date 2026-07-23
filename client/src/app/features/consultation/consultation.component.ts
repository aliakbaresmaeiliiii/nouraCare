import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import {
  CONSULTATION_CATEGORIES,
  ConsultationCategory,
} from '@app/shared/models/consultation-categories';
import { TranslationService } from '@app/shared/services/translation.service';
import { LanguageService } from '@app/shared/services/language.service';
import { addIcons } from 'ionicons';
import {
  chevronForward,
  femaleOutline,
  happyOutline,
  heartOutline,
  peopleOutline,
  sparklesOutline,
  warningOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private langChangeSub?: Subscription;

  readonly categories = CONSULTATION_CATEGORIES;
  searchTerm = '';

  constructor() {
    addIcons({
      femaleOutline,
      heartOutline,
      happyOutline,
      sparklesOutline,
      chevronForward,
      peopleOutline,
      warningOutline,
    });
  }

  ngOnInit() {
    this.langChangeSub = this.languageService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }

  categoryGradient(category: ConsultationCategory): string {
    return `linear-gradient(135deg, ${category.gradientFrom}, ${category.gradientTo})`;
  }

  categoryDoctorCountLabel(category: ConsultationCategory): string {
    return this.tParams('consultation.category.doctorCount', {
      count: category.displayCount,
    });
  }

  browseCategory(category: ConsultationCategory): void {
    void this.router.navigate(['/doctors/category', category.id]);
  }

  showAllDoctors(): void {
    void this.router.navigate(['/doctors']);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLIonSearchbarElement)?.value ?? '';
    this.searchTerm = typeof value === 'string' ? value : '';
    this.cdr.markForCheck();
  }

  submitSearch(): void {
    const q = this.searchTerm.trim();
    void this.router.navigate(['/doctors'], q ? { queryParams: { q } } : {});
  }

  runPullToRefresh(): void {
    this.cdr.markForCheck();
  }

  async onTabPullRefresh(event: Event): Promise<void> {
    const target = event.target as HTMLIonRefresherElement;
    try {
      this.runPullToRefresh();
    } finally {
      target.complete();
    }
  }

  async callEmergency() {
    const alert = await this.alertController.create({
      header: this.t('consultation.alert.emergency.header'),
      message: this.t('consultation.alert.emergency.message'),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('consultation.alert.callEmergency'),
          handler: () => {
            void this.showToast(this.t('consultation.toast.callingEmergency'), 'warning');
          },
        },
      ],
    });
    await alert.present();
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private tParams(key: string, params: Record<string, string | number>): string {
    return this.translation.translateParams(key, params);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
