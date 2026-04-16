import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService } from '../shared/services/doctor.service';
import { DoctorDto, ConsultationType } from '../shared/models/doctor.dto';
import { Share } from '@capacitor/share';
import { LogoLoadingComponent } from '../shared/components/logo-loading/logo-loading.component';

// Extend Window interface to include Capacitor
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform(): boolean;
    };
  }
}

@Component({
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.component.html',
  styleUrls: ['./doctor-profile.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, LogoLoadingComponent],
})
export class DoctorProfileComponent implements OnInit {
  doctor: DoctorDto | null = null;
  isLoading = true;
  selectedTab = 'about';
  
  availableSlots = [
    { time: '09:00 AM', available: true, price: 200 },
    { time: '10:30 AM', available: true, price: 200 },
    { time: '02:00 PM', available: false },
    { time: '03:30 PM', available: true, price: 200 },
    { time: '04:00 PM', available: true, price: 200 }
  ];

  reviews = [
    {
      id: '1',
      patientName: 'Sarah M.',
      rating: 5,
      comment: 'Dr. Johnson was incredibly thorough and made me feel comfortable throughout my entire pregnancy journey.',
      date: '2024-01-15',
      verified: true
    },
    {
      id: '2',
      patientName: 'Maria L.',
      rating: 5,
      comment: 'Excellent care and very knowledgeable. Highly recommend for high-risk pregnancies.',
      date: '2024-01-10',
      verified: true
    }
  ];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private doctorService = inject(DoctorService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  ngOnInit() {
    const doctorId = this.route.snapshot.paramMap.get('id');
    if (doctorId) {
      this.loadDoctorProfile(Number(doctorId));
    }
  }

  loadDoctorProfile(id: number) {
    this.isLoading = true;
    setTimeout(() => {
      this.doctor = {
        id: id,
        fullName: 'Dr. Sarah Johnson',
        specialty: 'Obstetrics & Gynecology',
        experienceYears: 12,
        about: 'Dr. Sarah Johnson is a board-certified obstetrician and gynecologist with over 12 years of experience.',
        rating: 4.8,
        profileImageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
        clinicName: 'Women\'s Health Center',
        location: 'New York, NY',
        contactEmail: 'sarah.johnson@whc.com',
        contactPhone: '+1 (555) 123-4567',
        consultationType: 'BOTH' as any,
        fee: 200
      };
      this.isLoading = false;
    }, 1000);
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  getStars(rating: any): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getConsultationTypeLabel(type: ConsultationType): string {
    switch (type) {
      case ConsultationType.ONLINE: return 'Online Consultation';
      case ConsultationType.IN_PERSON: return 'In-Person Visit';
      case ConsultationType.BOTH: return 'Online & In-Person';
      default: return 'Contact for details';
    }
  }

  getConsultationIcon(type: ConsultationType): string {
    switch (type) {
      case ConsultationType.ONLINE: return 'videocam';
      case ConsultationType.IN_PERSON: return 'business';
      case ConsultationType.BOTH: return 'globe';
      default: return 'medical';
    }
  }

  async bookAppointment(value?:any) {
    const toast = await this.toastController.create({
      message: 'Appointment booked successfully!',
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }
  isMobile = false;

  shareDoctorProfile() {
    if (!this.doctor || !this.isMobile) return;
    if (navigator.share) {
      navigator.share({
        title: this.doctor.fullName,
        text: this.doctor.about,
        url: window.location.href,
      }).catch(err => {
        console.log('Error sharing:', err);
        // Fallback to clipboard on mobile if share fails
        this.copyToClipboard();
      });
    } else {
      // Fallback for mobile devices without Web Share API
      this.copyToClipboard();
    }
  }

  private copyToClipboard() {
    if (!this.doctor) return;
    
    const shareText = `${this.doctor.fullName}\n\n${this.doctor.about}\n\n${window.location.href}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        console.log('Doctor profile link copied to clipboard');
      }).catch(err => {
        console.log('Failed to copy to clipboard:', err);
      });
    }
  }

  contactDoctor(method: 'phone' | 'email') {
    if (!this.doctor) return;

    if (method === 'phone' && this.doctor.contactPhone) {
      window.open(`tel:${this.doctor.contactPhone}`, '_blank');
    } else if (method === 'email' && this.doctor.contactEmail) {
      window.open(`mailto:${this.doctor.contactEmail}`, '_blank');
    }
  }

  goBack() {
    this.router.navigate(['/doctors']);
  }
}
