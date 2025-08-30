import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserDto } from '../models/user.dto';

@Injectable({
  providedIn: 'root',
})
export class User {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'user';

  getUser(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  updateUserInfo(id: string, formData: UserDto): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}/edit`, formData);
  }

  uploadProfileImage(id: string, blob: Blob): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', blob, 'profile.jpg');
    return this.http.post<{ url: string }>(`${this.baseUrl}/${id}/profile-image`, form);
  }

  // Geo - Fixed URLs with proper forward slash
  listCities(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiEndPoint}geo/cities`);
  }
  
  listDistricts(cityId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiEndPoint}geo/cities/${cityId}/districts`);
  }
  
  listUserAddresses(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiEndPoint}geo/users/${userId}/addresses`);
  }
  
  createAddress(userId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiEndPoint}geo/users/${userId}/addresses`, payload);
  }
}
