import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SymptomsDto } from '../shared/models/symptoms.dto';
import { TrackDataService } from '../shared/services/track-data.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { TranslationService } from '../shared/services/translation.service';
import { LanguageService } from '../shared/services/language.service';

@Component({
  selector: 'app-symptoms-detail',
  templateUrl: './symptoms-detail.component.html',
  styleUrls: ['./symptoms-detail.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS]
})
export class SymptomsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trackDataService = inject(TrackDataService);
  private translation = inject(TranslationService);
  private languageService = inject(LanguageService);

  selectedDate: string = '';
  dayData: SymptomsDto = {} as SymptomsDto;
  loading: boolean = true;
  emptyDescLabel = '';
  symptomsTitleLabel = '';

  ngOnInit() {
    this.languageService.currentLanguage$.subscribe(() => this.refreshLabels());
    this.route.queryParams.subscribe(params => {
      this.selectedDate = params['date'];
      if (this.selectedDate) {
        this.loadDayData();
      }
    });
  }

  private refreshLabels(): void {
    this.emptyDescLabel = this.translation.translateParams('symptomsDetail.emptyDesc', {
      date: this.formatDate(this.selectedDate),
    });
    const count = this.dayData?.symptoms?.length ?? 0;
    this.symptomsTitleLabel = this.translation.translateParams('symptomsDetail.symptomsTitle', {
      count,
    });
  }

  loadDayData() {
    this.loading = true;
    const userId = this.getCurrentUserId();
    this.trackDataService.getTrackDay(userId, this.selectedDate).subscribe({
      next: (data) => {
        console.log('🔍 Recent symptoms days:', data);
        this.dayData = data[0];
        this.refreshLabels();
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

  editDay() {
    this.router.navigate(['/symptoms-tracker'], {
      queryParams: { date: this.selectedDate }
    });
  }
}
