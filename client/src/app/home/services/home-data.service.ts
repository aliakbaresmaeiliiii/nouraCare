import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TrackDataService } from '../../shared/services/track-data.service';
import { SymptomsDto } from '../../shared/models/symptoms.dto';

@Injectable({
  providedIn: 'root'
})
export class HomeDataService {

  constructor(private trackDataService: TrackDataService) {}

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

  /**
   * Get current user ID from localStorage
   */
  getCurrentUserId(): number {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        return parseInt(parsed.user?.id || parsed.id || '0');
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return 0;
  }

  /**
   * Get user info from localStorage
   */
  getUserInfo(): any {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        return JSON.parse(userInfo);
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
    return null;
  }

  /**
   * Save user status
   */
  saveUserStatus(status: string): void {
    try {
      const userInfo = this.getUserInfo() || {};
      userInfo.status = status;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Error saving user status:', error);
    }
  }

  /**
   * Get user status
   */
  getUserStatus(): string {
    const userInfo = this.getUserInfo();
    return userInfo?.status || 'Not Set';
  }
}
