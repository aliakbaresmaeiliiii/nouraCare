import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
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
    // API envelope: { isSuccess, data: { url } } — unwrap so callers get `{ url }`.
    return this.http.post<unknown>(`${this.baseUrl}/${id}/profile-image`, form).pipe(
      map((res) => {
        const envelope = res as { data?: { url?: string }; url?: string } | null;
        const url = envelope?.data?.url ?? envelope?.url;
        if (!url || typeof url !== 'string' || !url.trim()) {
          throw new Error('Profile image upload returned no URL');
        }
        return { url: url.trim() };
      }),
    );
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

  requestDataExport(): Observable<{ data?: { email?: string } }> {
    return this.http.post<{ data?: { email?: string } }>(
      `${this.baseUrl}/me/export-data`,
      {},
    );
  }

  deleteMyAccount(): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/me`);
  }
}
