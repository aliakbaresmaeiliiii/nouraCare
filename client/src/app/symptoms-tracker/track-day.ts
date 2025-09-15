import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrackDay {
  httpClient = inject(HttpClient);
  apiUrl = environment.apiEndPoint + 'track-day';

  // getSymptoms(userId: number, date?: string): Observable<any[]> {
  //   const today = date || new Date().toISOString().split('T')[0];
  //   return this.httpClient.get<any[]>(`${this.apiUrl}/${userId}/${today}`);
  // }

  // Get multiple days at once (if you implement this endpoint)
  getSymptomsRange(userId: number, startDate: string, endDate: string): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.apiUrl}/${userId}/range`, {
      params: { startDate, endDate }
    });
  }

  createSymptoms(userId: any, symptomsData: any): Observable<any> {
    return this.httpClient.post<any>(`${this.apiUrl}/${userId}`, symptomsData);
  }
}
