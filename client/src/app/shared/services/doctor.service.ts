import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DoctorDto } from '../models/doctor.dto';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'doctors';

  // Get all doctors
  getDoctors(): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(`${this.baseUrl}`);
  }

  // Get doctor by ID
  getDoctorById(id: number): Observable<DoctorDto | undefined> {
    return this.http.get<DoctorDto>(`${this.baseUrl}/${id}`);
  }



  // Update doctor
  updateDoctor(id: number, doctorData: Partial<DoctorDto>): Observable<DoctorDto | null> {
    return this.http.put<DoctorDto>(`${this.baseUrl}/${id}`, doctorData);
  }

  // Delete doctor
  deleteDoctor(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`);
  }

  // Get doctors by specialty
  getDoctorsBySpecialty(specialty: string): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(`${this.baseUrl}/specialty/${specialty}`);
  }

  // Search doctors
  searchDoctors(query: string): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(`${this.baseUrl}/search?query=${query}`);
  }

}
