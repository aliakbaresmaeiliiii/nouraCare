import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TrackDayData {
  id?: number;
  userId: number;
  date: string;
  symptoms: any[];
  mood: string;
  energy: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackDataService {
  private trackDataSubject = new BehaviorSubject<TrackDayData[]>([]);
  public trackData$ = this.trackDataSubject.asObservable();

  private readonly STORAGE_KEY = 'trackData';

  constructor(private httpClient: HttpClient) {
    this.loadFromStorage();
  }

  // Get all track data
  getTrackData(): TrackDayData[] {
    return this.trackDataSubject.value;
  }

  // Get track data as observable
  getTrackDataObservable(): Observable<TrackDayData[]> {
    return this.trackData$;
  }

  // Get track data for a specific date
  getTrackDataByDate(date: string): TrackDayData | null {
    const allData = this.getTrackData();
    return allData.find(data => data.date === date) || null;
  }

  // Get track data for a date range
  getTrackDataByDateRange(startDate: string, endDate: string): TrackDayData[] {
    const allData = this.getTrackData();
    return allData.filter(data => 
      data.date >= startDate && data.date <= endDate
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get today's track data
  getTodayTrackData(): TrackDayData | null {
    const today = new Date().toISOString().split('T')[0];
    return this.getTrackDataByDate(today);
  }

  // Add or update track data
  saveTrackData(trackData: TrackDayData): void {
    const currentData = this.getTrackData();
    const existingIndex = currentData.findIndex(data => data.date === trackData.date);
    
    if (existingIndex >= 0) {
      // Update existing
      currentData[existingIndex] = {
        ...currentData[existingIndex],
        ...trackData,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new
      currentData.push({
        ...trackData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Sort by date (newest first)
    currentData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    this.trackDataSubject.next(currentData);
    this.saveToStorage();
  }

  // Delete track data for a specific date
  deleteTrackData(date: string): void {
    const currentData = this.getTrackData();
    const filteredData = currentData.filter(data => data.date !== date);
    this.trackDataSubject.next(filteredData);
    this.saveToStorage();
  }

  // Clear all track data
  clearAllTrackData(): void {
    this.trackDataSubject.next([]);
    this.saveToStorage();
  }

  // Get recent track data (last N days)
  getRecentTrackData(days: number = 7): TrackDayData[] {
    const allData = this.getTrackData();
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - days);
    
    return allData.filter(data => 
      new Date(data.date) >= cutoffDate
    ).slice(0, days);
  }

  // Get track data summary (count of tracked days, symptoms count, etc.)
  getTrackDataSummary(): {
    totalDays: number;
    recentDays: number;
    totalSymptoms: number;
    averageSymptomsPerDay: number;
    lastTrackedDate: string | null;
  } {
    const allData = this.getTrackData();
    const recentData = this.getRecentTrackData(7);
    
    const totalSymptoms = allData.reduce((sum, data) => sum + data.symptoms.length, 0);
    const averageSymptomsPerDay = allData.length > 0 ? totalSymptoms / allData.length : 0;
    
    return {
      totalDays: allData.length,
      recentDays: recentData.length,
      totalSymptoms,
      averageSymptomsPerDay: Math.round(averageSymptomsPerDay * 10) / 10,
      lastTrackedDate: allData.length > 0 ? allData[0].date : null
    };
  }

  // Private methods for localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.trackDataSubject.next(data);
      }
    } catch (error) {
      console.error('Error loading track data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = this.getTrackData();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving track data to storage:', error);
    }
  }


  getTrackDay(userId: number, date: string): Observable<any[]> {
    return this.httpClient.get<any[]>(`${environment.apiEndPoint}track-day/${userId}/${date}`);
  }

  createSymptoms(userId: any, symptomsData: any): Observable<any> {
    return this.httpClient.post<any>(`${environment.apiEndPoint}track-day/${userId}`, symptomsData);
  }

  updateSymptoms(userId: any, date: string, symptomsData: any): Observable<any> {
    return this.httpClient.put<any>(`${environment.apiEndPoint}track-day/${userId}/${date}`, symptomsData);
  }
}
