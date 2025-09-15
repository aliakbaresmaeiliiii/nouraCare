import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { TrackDay } from '../symptoms-tracker/track-day';

@Component({
  selector: 'app-symptoms-history',
  templateUrl: './symptoms-history.component.html',
  styleUrls: ['./symptoms-history.component.scss'],
  standalone: true,
  imports: [SharedModule]
})
export class SymptomsHistoryComponent implements OnInit {
  private router = inject(Router);
  private trackDayService = inject(TrackDay);

  symptomsHistory: any[] = [];
  loading: boolean = true;

  ngOnInit() {
    this.loadSymptomsHistory();
  }

  loadSymptomsHistory() {
    this.loading = true;
    const userId = this.getCurrentUserId();
    
    // Load last 30 days of symptoms data
    const today = new Date();
    const promises = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      promises.push(
        this.trackDayService.getSymptomsRange(userId, dateString, dateString).subscribe({
          next: (data) => {
            this.symptomsHistory.push(data[0]);
          },
          error: (error) => {
            console.error('Error loading symptoms history:', error);
          },
          complete: () => {
            this.loading = false;
            console.log('🔍 Symptoms history loaded:', this.symptomsHistory);
          }
        })
      );

      
    //   promises.push(
    //     this.trackDayService.getSymptoms(userId, dateString).toPromise()
    //   );
    // }
    
    // Promise.all(promises).then((results) => {
    //   this.symptomsHistory = results
    //     .map((data, index) => {
    //       if (data && data.length > 0) {
    //         const dayData = data[0];
    //         const date = new Date(today);
    //         date.setDate(today.getDate() - index);
            
    //         return {
    //           ...dayData,
    //           date: date.toISOString().split('T')[0],
    //           symptoms: typeof dayData.symptoms === 'string' 
    //             ? JSON.parse(dayData.symptoms) 
    //             : dayData.symptoms,
    //           mood: typeof dayData.mood === 'string' 
    //             ? JSON.parse(dayData.mood) 
    //             : dayData.mood,
    //           energy: typeof dayData.energy === 'string' 
    //             ? JSON.parse(dayData.energy) 
    //             : dayData.energy
    //         };
    //       }
    //       return null;
    //     })
    //     .filter(day => day !== null);
      
    //   this.loading = false;
    // }).catch((error) => {
    //   console.error('Error loading symptoms history:', error);
    //   this.loading = false;
    };
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  getDayName(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }

  goBack() {
    this.router.navigate(['tabs/home']);
  }

  viewDayDetails(date: string) {
    this.router.navigate(['/symptoms-detail'], {
      queryParams: { date: date }
    });
  }

  trackNewSymptoms() {
    this.router.navigate(['/symptoms-tracker']);
  }
}
