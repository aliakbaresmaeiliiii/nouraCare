import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DoctorBookingType } from '../models/doctor-booking.model';

export interface DoctorScheduleSlotDto {
  id: string;
  scheduledAt: string;
  available: boolean;
}

export interface DoctorScheduleResponse {
  doctorId: string;
  slots: DoctorScheduleSlotDto[];
}

export interface CreateAppointmentRequest {
  doctorId: string;
  slotKey: string;
  consultationType: DoctorBookingType;
}

export interface AppointmentDto {
  id: string;
  doctorId: string;
  userId: number;
  slotKey: string;
  scheduledAt: string;
  consultationType: 'ONLINE' | 'IN_PERSON';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  feeTomans: number | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class DoctorAppointmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiEndPoint;

  getDoctorSchedule(doctorId: string): Observable<DoctorScheduleResponse> {
    return this.http.get<DoctorScheduleResponse>(
      `${this.baseUrl}doctors/${encodeURIComponent(doctorId)}/schedule`,
    );
  }

  createAppointment(body: CreateAppointmentRequest): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${this.baseUrl}appointments`, body);
  }

  cancelAppointment(appointmentId: string): Observable<AppointmentDto> {
    return this.http.patch<AppointmentDto>(
      `${this.baseUrl}appointments/${encodeURIComponent(appointmentId)}/cancel`,
      {},
    );
  }

  confirmAppointment(appointmentId: string): Observable<AppointmentDto> {
    return this.http.patch<AppointmentDto>(
      `${this.baseUrl}appointments/${encodeURIComponent(appointmentId)}/confirm`,
      {},
    );
  }
}
