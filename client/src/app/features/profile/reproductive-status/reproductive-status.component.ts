import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReproductiveStatusService } from '../../../shared/services/reproductive-status.service';

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
  private reproductiveStatusService = inject(ReproductiveStatusService);

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
    
    switch (status) {
      case 'planning':
        this.router.navigate(['/pregnancy-planning']);
        break;
      case 'pregnant':
        this.router.navigate(['/pregnancy-journey']);
        break;
      case 'postpartum':
        this.router.navigate(['/postpartum']);
        break;
      case 'period':
        this.showCycleTrackingMessage();
        this.updateReproductiveStatus(status);
        break;
    }
  }

  private showCycleTrackingMessage(): void {
    // Simple alert for now - in a real app, you'd use a proper notification service
    alert('Cycle tracking activated');
  }

  private updateReproductiveStatus(status: ReproductiveStatusOption): void {
    // Here we would update the reproductive status via the service
    // For now, we'll just log it since the actual implementation would require user context
    console.log('Updating reproductive status:', status);
    
    // Example of how we would update the status when we have user context:
    // this.reproductiveStatusService.updateReproductiveStatus(userId, {
    //   // Update relevant fields based on the selected status
    // }).subscribe();
  }
}
