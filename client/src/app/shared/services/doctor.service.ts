import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DoctorDto,
  DoctorListQuery,
  PaginatedDoctorsResponse,
} from '../models/doctor.dto';
import { environment } from '../../../environments/environment';

function normalizeDoctorsPage(body: unknown): PaginatedDoctorsResponse {
  if (Array.isArray(body)) {
    return {
      items: body as DoctorDto[],
      total: body.length,
      page: 1,
      limit: body.length,
      totalPages: 1,
      hasMore: false,
    };
  }

  const envelope = body as Record<string, unknown>;
  const payload = (envelope?.['data'] ?? envelope) as Partial<PaginatedDoctorsResponse>;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const total = payload.total ?? items.length;
  const limit = payload.limit ?? items.length;
  const page = payload.page ?? 1;
  const totalPages =
    payload.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasMore: payload.hasMore ?? page < totalPages,
  };
}

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
    return this.http
      .get<unknown>(this.baseUrl, { params })
      .pipe(map((body) => normalizeDoctorsPage(body)));
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
    return this.getDoctorsPage({ page: 1, limit: 50, specialty }).pipe(
      map((res) => res.items),
    );
  }

  searchDoctors(query: string): Observable<DoctorDto[]> {
    return this.getDoctorsPage({ page: 1, limit: 50, search: query }).pipe(
      map((res) => res.items),
    );
  }
}
