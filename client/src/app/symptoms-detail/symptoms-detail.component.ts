import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonButton, IonIcon, IonChip, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonNote, IonBadge } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TrackDataService } from '../shared/services/track-data.service';
import { SharedModule } from '../shared/shared-module';
import { SymptomsDto } from '../shared/models/symptoms.dto';

@Component({
  selector: 'app-symptoms-detail',
  templateUrl: './symptoms-detail.component.html',
  styleUrls: ['./symptoms-detail.component.scss'],
  standalone: true,
  imports: [SharedModule]
})
export class SymptomsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trackDataService = inject(TrackDataService);

  selectedDate: string = '';
  dayData: SymptomsDto = {} as SymptomsDto;
  loading: boolean = true;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.selectedDate = params['date'];
      if (this.selectedDate) {
        this.loadDayData();
      }
    });
  }

  loadDayData() {
    this.loading = true;
    const userId = this.getCurrentUserId();

    this.trackDataService.getTrackDay(userId, this.selectedDate).subscribe({
      next: (data) => {
        console.log('🔍 Recent symptoms days:', data);
        this.dayData = data[0];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading day data:', error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getCurrentUserId(): number {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        return parsed.userId || parsed.user?.id || parsed.id || 1;
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return 1;
  }

  getMoodIcon(mood: string): string {
    const moodIcons: { [key: string]: string } = {
      'excellent': 'happy-outline',
      'good': 'happy-outline',
      'okay': 'remove-outline',
      'poor': 'sad-outline',
      'terrible': 'sad-outline'
    };
    return moodIcons[mood] || 'remove-outline';
  }

  getEnergyIcon(energy: string): string {
    const energyIcons: { [key: string]: string } = {
      'high': 'flash-outline',
      'medium': 'battery-half-outline',
      'low': 'battery-dead-outline'
    };
    return energyIcons[energy] || 'help-outline';
  }

  getSeverityColor(severity: string): string {
    const severityColors: { [key: string]: string } = {
      'mild': 'success',
      'moderate': 'warning',
      'severe': 'danger'
    };
    return severityColors[severity] || 'medium';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goBack() {
    this.router.navigate(['tabs/home']);
  }

  editDay() {
    this.router.navigate(['/symptoms-tracker'], {
      queryParams: { date: this.selectedDate }
    });
  }
}
