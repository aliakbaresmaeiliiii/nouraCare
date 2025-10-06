import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { ReproductiveStatusService, ReproductiveStatusData } from '../shared/services/reproductive-status.service';
import { Router } from '@angular/router';
import { HomeDataService } from '../home/services/home-data.service';

@Component({
  selector: 'app-cycle-calendar',
  templateUrl: './cycle-calendar.component.html',
  styleUrls: ['./cycle-calendar.component.scss'],
  imports: [SharedModule]
})
export class CycleCalendarComponent implements OnInit {
  private reproductiveStatusService = inject(ReproductiveStatusService);
  private router = inject(Router);
  homeService = inject(HomeDataService)

  reproductiveStatus: ReproductiveStatusData = {};
  nextPeriodDate: Date | null = null;
  fertileWindow: { start: Date; end: Date } | null = null;
  pastLogs: any[] = [];

  ngOnInit() {
    const userId = this.homeService.getCurrentUserId()
    this.loadReproductiveStatus(userId);
    this.loadPastLogs();
  }

  loadReproductiveStatus(userId:number) {
    this.reproductiveStatusService.getReproductiveStatus(userId).subscribe({
      next: (data) => {
        this.reproductiveStatus = data;
        this.calculateCycleDates();
      },
      error: (error) => {
        console.error('Error loading reproductive status:', error);
      }
    });
  }

  loadPastLogs() {
    // Mock data for past logs - in real implementation, this would come from API
    this.pastLogs = [
      {
        date: '2025-01-15',
        mood: 'Happy',
        notes: 'Regular flow, mild cramps',
        symptoms: ['Cramps', 'Bloating']
      },
      {
        date: '2024-12-20',
        mood: 'Tired',
        notes: 'Heavy flow, fatigue',
        symptoms: ['Fatigue', 'Headache']
      }
    ];
  }

  calculateCycleDates() {
    if (this.reproductiveStatus.lastPeriodDate && this.reproductiveStatus.averageCycleLength) {
      this.nextPeriodDate = this.reproductiveStatusService.calculateNextPeriod(
        this.reproductiveStatus.lastPeriodDate,
        this.reproductiveStatus.averageCycleLength
      );
      
      this.fertileWindow = this.reproductiveStatusService.calculateFertileWindow(
        this.reproductiveStatus.lastPeriodDate,
        this.reproductiveStatus.averageCycleLength
      );
    }
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  trackMood(mood: string) {
    // In real implementation, this would save to API
    console.log('Tracking mood:', mood);
    // Show success message
    this.showToast('Mood tracked successfully!');
  }

  private showToast(message: string) {
    // Simple toast implementation - in real app, use Ionic Toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--ion-color-dark);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }
}
