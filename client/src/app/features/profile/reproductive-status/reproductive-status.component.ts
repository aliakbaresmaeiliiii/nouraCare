import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
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
      label: "I'm on my period",
      description: 'Track your menstrual cycle',
    },
    {
      id: 'pregnant' as ReproductiveStatusOption,
      icon: '🤰',
      label: "I'm pregnant",
      description: 'Monitor your pregnancy journey',
    },
    {
      id: 'planning' as ReproductiveStatusOption,
      icon: '🕊',
      label: "I'm planning to get pregnant",
      description: 'Plan for conception',
    },
    {
      id: 'postpartum' as ReproductiveStatusOption,
      icon: '👶',
      label: "I've given birth",
      description: 'Postpartum care and tracking',
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
