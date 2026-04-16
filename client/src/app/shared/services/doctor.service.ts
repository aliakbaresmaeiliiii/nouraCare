import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DoctorDto,
  DoctorListQuery,
  PaginatedDoctorsResponse,
} from '../models/doctor.dto';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  http = inject(HttpClient);
  private readonly baseUrl = environment.apiEndPoint + 'doctors';

  getDoctorsPage(query: DoctorListQuery = {}): Observable<PaginatedDoctorsResponse> {
    let params = new HttpParams();
    if (query.page != null) {
      params = params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params = params.set('limit', String(query.limit));
    }
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.specialty != null && query.specialty !== '') {
      params = params.set('specialty', query.specialty);
    }
    if (query.consultationType != null && query.consultationType !== '') {
      params = params.set('consultationType', query.consultationType);
    }
    return this.http.get<PaginatedDoctorsResponse>(this.baseUrl, { params });
  }

  getDoctorById(id: string): Observable<DoctorDto> {
    return this.http.get<DoctorDto>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  updateDoctor(id: string, doctorData: Partial<DoctorDto>): Observable<DoctorDto | null> {
    return this.http.put<DoctorDto>(`${this.baseUrl}/${encodeURIComponent(id)}`, doctorData);
  }

  deleteDoctor(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  getDoctorsBySpecialty(specialty: string): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(`${this.baseUrl}/specialty/${encodeURIComponent(specialty)}`);
  }

  searchDoctors(query: string): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(`${this.baseUrl}/search`, {
      params: new HttpParams().set('query', query),
    });
  }
}
