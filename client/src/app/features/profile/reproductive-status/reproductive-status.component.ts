import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OnboardingService, ReproductiveState } from '../../../shared/services/onboarding.service';

export type ReproductiveStatusOption = 'period' | 'pregnant' | 'planning' | 'postpartum';

@Component({
  selector: 'app-reproductive-status',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './reproductive-status.component.html',
  styleUrls: ['./reproductive-status.component.scss']
})
export class ReproductiveStatusComponent {
  private router = inject(Router);
  private onboardingService = inject(OnboardingService);

  selectedStatus = signal<ReproductiveStatusOption | null>(null);

  readonly statusOptions = [
    {
      id: 'period' as ReproductiveStatusOption,
      icon: '🩸',
      label: 'I\'m on my period',
      description: 'Track your menstrual cycle'
    },
    {
      id: 'pregnant' as ReproductiveStatusOption,
      icon: '🤰',
      label: 'I\'m pregnant',
      description: 'Monitor your pregnancy journey'
    },
    {
      id: 'planning' as ReproductiveStatusOption,
      icon: '🕊',
      label: 'I\'m planning to get pregnant',
      description: 'Plan for conception'
    },
    {
      id: 'postpartum' as ReproductiveStatusOption,
      icon: '👶',
      label: 'I\'ve given birth',
      description: 'Postpartum care and tracking'
    }
  ];

  selectStatus(status: ReproductiveStatusOption): void {
    this.selectedStatus.set(status);
    const state = this.mapStatus(status);
    this.onboardingService.updateReproductiveState({ state }).subscribe({
      next: () => this.router.navigate(['/tabs/home']),
      error: () => alert('Failed to update status. Please try again.'),
    });
  }

  private showCycleTrackingMessage(): void {
    // Simple alert for now - in a real app, you'd use a proper notification service
    alert('Cycle tracking activated');
  }

  private mapStatus(status: ReproductiveStatusOption): ReproductiveState {
    if (status === 'period') return 'cycle';
    return status;
  }
}
