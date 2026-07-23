import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TrackDataService } from '@app/shared/services/track-data.service';
import { SymptomsDto } from '@app/shared/models/symptoms.dto';
import {
  UserInfoStore,
  UserSessionService,
} from '@app/shared/services/user-session.service';

@Injectable({
  providedIn: 'root'
})
export class HomeDataService {
  private trackDataService = inject(TrackDataService);
  private userSession = inject(UserSessionService);

  /**
   * Load today's symptoms data
   */
  loadTodaySymptoms(userId: number): Observable<any> {
    const today = new Date().toISOString().split('T')[0];
    return this.trackDataService.getTrackDay(userId, today);
  }

  /**
   * Process symptoms data from API response
   */
  processSymptomsData(data: any, userId: number): SymptomsDto {
    const today = new Date().toISOString().split('T')[0];
    
    if (data) {
      const rawData = data;
      
      // Parse symptoms if they're stored as JSON string
      let parsedSymptoms = rawData.symptoms;
      if (typeof rawData.symptoms === 'string') {
        try {
          parsedSymptoms = JSON.parse(rawData.symptoms);
        } catch (e) {
          console.warn('Failed to parse symptoms JSON:', e);
          parsedSymptoms = [];
        }
      }
      
      // Ensure symptoms is an array
      if (!Array.isArray(parsedSymptoms)) {
        parsedSymptoms = [];
      }

      const symptomsDto: SymptomsDto = {
        userId: rawData.userId || userId,
        date: rawData.date || today,
        mood: rawData.mood || '',
        energy: rawData.energy || '',
        symptoms: parsedSymptoms,
        notes: rawData.notes || ''
      };

      // Store in local service for future use
      this.trackDataService.saveTrackData({
        id: rawData.id,
        userId: userId,
        date: today,
        symptoms: parsedSymptoms,
        mood: rawData.mood,
        energy: rawData.energy,
        notes: rawData.notes,
        createdAt: rawData.createdAt,
        updatedAt: rawData.updatedAt
      });

      return symptomsDto;
    } else {
      // No data for today, return empty
      return {
        userId: userId,
        date: today,
        mood: '',
        energy: '',
        symptoms: [],
        notes: ''
      } as SymptomsDto;
    }
  }

  /** Delegates to {@link UserSessionService} for one consistent id rule. */
  getCurrentUserId(): number {
    return this.userSession.getCurrentUserId();
  }

  /** Parsed `userInfo` from storage, or null. */
  getUserInfo(): UserInfoStore | null {
    return this.userSession.parseUserInfoStore();
  }

  /**
   * Save user status
   */
  saveUserStatus(status: string): void {
    try {
      const userInfo = this.userSession.getUserInfoStoreOrEmpty();
      userInfo['status'] = status;
      this.userSession.setUserInfoStore(userInfo);
    } catch (error) {
      console.error('Error saving user status:', error);
    }
  }

  /**
   * Get user status
   */
  getUserStatus(): string {
    const userInfo = this.getUserInfo();
    const s = userInfo?.['status'];
    return (typeof s === 'string' && s ? s : 'Not Set');
  }
}
