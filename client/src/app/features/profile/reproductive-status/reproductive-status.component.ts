import { Component, inject, signal } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '../../../shared/shared-standalone';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import {
  InitializeReproductiveStateDto,
  OnboardingService,
  ReproductiveStatus,
} from '../../../shared/services/onboarding.service';
import { PregnancySetupSheetComponent } from '../../../shared/components/pregnancy-setup-sheet/pregnancy-setup-sheet.component';

export type ReproductiveStatusOption =
  | 'period'
  | 'pregnant'
  | 'planning'
  | 'postpartum';

@Component({
  selector: 'app-reproductive-status',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './reproductive-status.component.html',
  styleUrls: ['./reproductive-status.component.scss'],
})
export class ReproductiveStatusComponent {
  private router = inject(Router);
  private onboardingService = inject(OnboardingService);
  private modalController = inject(ModalController);

  selectedStatus = signal<ReproductiveStatusOption | null>(null);

  readonly statusOptions = [
    {
      id: 'period' as ReproductiveStatusOption,
      icon: '🩸',
      labelKey: 'reproductiveStatusPicker.option.period.label',
      descriptionKey: 'reproductiveStatusPicker.option.period.description',
    },
    {
      id: 'pregnant' as ReproductiveStatusOption,
      icon: '🤰',
      labelKey: 'reproductiveStatusPicker.option.pregnant.label',
      descriptionKey: 'reproductiveStatusPicker.option.pregnant.description',
    },
    {
      id: 'planning' as ReproductiveStatusOption,
      icon: '🕊',
      labelKey: 'reproductiveStatusPicker.option.planning.label',
      descriptionKey: 'reproductiveStatusPicker.option.planning.description',
    },
    {
      id: 'postpartum' as ReproductiveStatusOption,
      icon: '👶',
      labelKey: 'reproductiveStatusPicker.option.postpartum.label',
      descriptionKey: 'reproductiveStatusPicker.option.postpartum.description',
    },
  ];

  async selectStatus(status: ReproductiveStatusOption): Promise<void> {
    this.selectedStatus.set(status);
    const state = this.mapStatus(status);
    if (state === 'pregnant') {
      const modal = await this.modalController.create({
        component: PregnancySetupSheetComponent,
      });
      await modal.present();
      const { data, role } =
        await modal.onWillDismiss<InitializeReproductiveStateDto>();
      if (role !== 'confirm' || !data) {
        return;
      }
      this.onboardingService.updateReproductiveState(data).subscribe({
        next: () => this.router.navigate(['/tabs/home']),
        error: () => alert('Failed to update status. Please try again.'),
      });
      return;
    }
    this.onboardingService.updateReproductiveState({ state }).subscribe({
      next: () => this.router.navigate(['/tabs/home']),
      error: () => alert('Failed to update status. Please try again.'),
    });
  }

  

  private mapStatus(status: ReproductiveStatusOption): ReproductiveStatus {
    if (status === 'period') return 'cycle';
    return status;
  }
}
