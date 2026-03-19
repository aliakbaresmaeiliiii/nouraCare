import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { DoctorService } from '../shared/services/doctor.service';
import { DoctorDto, ConsultationType } from '../shared/models/doctor.dto';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-doctors',
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS]
})
export class DoctorsComponent implements OnInit {
  doctors: DoctorDto[] = [];
  filteredDoctors: DoctorDto[] = [];
  isLoading = false;
  searchTerm = '';
  selectedSpecialty = 'all';
  selectedConsultationType = 'all';

  specialties = [
    'Obstetrics & Gynecology',
    'Maternal-Fetal Medicine', 
    'Reproductive Endocrinology',
    'Fertility Specialist',
    'Prenatal Care',
    'High-Risk Pregnancy'
  ];

  consultationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'ONLINE', label: 'Online Only' },
    { value: 'IN_PERSON', label: 'In-Person Only' },
    { value: 'BOTH', label: 'Both Available' }
  ];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.loadDoctors();
  }

  // Load all doctors
  async loadDoctors() {
    this.isLoading = true;
    
    // Create comprehensive mock doctors list
    const mockDoctors: DoctorDto[] = [
      {
        id: 1,
        fullName: 'Dr. Sarah Johnson',
        specialty: 'Obstetrics & Gynecology',
        experienceYears: 12,
        about: 'Specialized in high-risk pregnancies and fertility treatments. Passionate about women\'s health and providing comprehensive care throughout pregnancy journey.',
        rating: 4.8,
        profileImageUrl: 'assets/images/doctor-sarah.jpg',
        clinicName: 'Women\'s Health Center',
        location: 'New York, NY',
        contactEmail: 'sarah.johnson@whc.com',
        contactPhone: '+1 (555) 123-4567',
        consultationType: 'BOTH' as any,
        fee: 200
      },
      {
        id: 2,
        fullName: 'Dr. Emily Rodriguez',
        specialty: 'Maternal-Fetal Medicine',
        experienceYears: 8,
        about: 'Expert in prenatal care and fetal development monitoring. Dedicated to ensuring healthy pregnancies and safe deliveries.',
        rating: 4.9,
        profileImageUrl: 'assets/images/doctor-emily.jpg',
        clinicName: 'Maternal Care Clinic',
        location: 'Los Angeles, CA',
        contactEmail: 'emily.rodriguez@mcc.com',
        contactPhone: '+1 (555) 987-6543',
        consultationType: 'ONLINE' as any,
        fee: 180
      },
      {
        id: 3,
        fullName: 'Dr. Michael Chen',
        specialty: 'Reproductive Endocrinology',
        experienceYears: 15,
        about: 'Leading fertility specialist with extensive experience in IVF, hormone therapy, and reproductive health optimization.',
        rating: 4.7,
        profileImageUrl: 'assets/images/doctor-michael.jpg',
        clinicName: 'Fertility Solutions Center',
        location: 'Chicago, IL',
        contactEmail: 'michael.chen@fsc.com',
        contactPhone: '+1 (555) 456-7890',
        consultationType: 'IN_PERSON' as any,
        fee: 250
      },
      {
        id: 4,
        fullName: 'Dr. Amanda Wilson',
        specialty: 'High-Risk Pregnancy',
        experienceYears: 10,
        about: 'Specialist in managing complex pregnancies and providing expert care for high-risk maternal and fetal conditions.',
        rating: 4.6,
        profileImageUrl: 'assets/images/doctor-amanda.jpg',
        clinicName: 'Advanced Maternal Care',
        location: 'Boston, MA',
        contactEmail: 'amanda.wilson@amc.com',
        contactPhone: '+1 (555) 234-5678',
        consultationType: 'BOTH' as any,
        fee: 220
      },
      {
        id: 5,
        fullName: 'Dr. James Thompson',
        specialty: 'Fertility Specialist',
        experienceYears: 18,
        about: 'Renowned fertility expert with over 18 years of experience in reproductive medicine and assisted reproductive technologies.',
        rating: 4.9,
        profileImageUrl: 'assets/images/doctor-james.jpg',
        clinicName: 'Reproductive Health Institute',
        location: 'San Francisco, CA',
        contactEmail: 'james.thompson@rhi.com',
        contactPhone: '+1 (555) 345-6789',
        consultationType: 'BOTH' as any,
        fee: 280
      },
      {
        id: 6,
        fullName: 'Dr. Lisa Martinez',
        specialty: 'Prenatal Care',
        experienceYears: 7,
        about: 'Dedicated to providing comprehensive prenatal care with a focus on preventive medicine and patient education.',
        rating: 4.5,
        profileImageUrl: 'assets/images/doctor-lisa.jpg',
        clinicName: 'Family Health Center',
        location: 'Miami, FL',
        contactEmail: 'lisa.martinez@fhc.com',
        contactPhone: '+1 (555) 456-7890',
        consultationType: 'ONLINE' as any,
        fee: 150
      }
    ];

    this.doctors = mockDoctors;
    this.filteredDoctors = mockDoctors;
    this.isLoading = false;
  }

  // Search doctors
  searchDoctors(event: any) {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  // Filter by specialty
  filterBySpecialty(event: any) {
    this.selectedSpecialty = event.detail.value;
    this.applyFilters();
  }

  // Filter by consultation type
  filterByConsultationType(event: any) {
    this.selectedConsultationType = event.detail.value;
    this.applyFilters();
  }

  // Apply all filters
  applyFilters() {
    let filtered = [...this.doctors];

    // Search filter
    if (this.searchTerm && this.searchTerm.length > 0) {
      filtered = filtered.filter(doctor => 
        doctor.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doctor.location?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Specialty filter
    if (this.selectedSpecialty !== 'all') {
      filtered = filtered.filter(doctor => 
        doctor.specialty.toLowerCase().includes(this.selectedSpecialty.toLowerCase())
      );
    }

    // Consultation type filter
    if (this.selectedConsultationType !== 'all') {
      filtered = filtered.filter(doctor => 
        doctor.consultationType === this.selectedConsultationType || 
        doctor.consultationType === 'BOTH'
      );
    }

    this.filteredDoctors = filtered;
  }

  // Clear all filters
  clearFilters() {
    this.searchTerm = '';
    this.selectedSpecialty = 'all';
    this.selectedConsultationType = 'all';
    this.filteredDoctors = [...this.doctors];
  }

  // Book appointment with doctor
  async bookWithDoctor(doctor: DoctorDto) {
    const alert = await this.alertController.create({
      header: `Book with ${doctor.fullName}`,
      message: `${doctor.specialty}\n\nFee: $${doctor.fee}\n\n${doctor.about.substring(0, 100)}...`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Book Appointment',
          handler: () => {
            this.showBookingOptions(doctor);
          }
        },
        {
          text: 'View Profile',
          handler: () => {
            this.viewDoctorProfile(doctor);
          }
        }
      ]
    });

    await alert.present();
  }

  // Show booking options
  async showBookingOptions(doctor: DoctorDto) {
    const buttons: any[] = [];
    
    if (doctor.consultationType === 'ONLINE' || doctor.consultationType === 'BOTH') {
      buttons.push({
        text: '💻 Online Consultation',
        handler: () => {
          this.bookAppointment(doctor, 'online');
        }
      });
    }
    
    if (doctor.consultationType === 'IN_PERSON' || doctor.consultationType === 'BOTH') {
      buttons.push({
        text: '🏥 In-Person Visit',
        handler: () => {
          this.bookAppointment(doctor, 'in-person');
        }
      });
    }
    
    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });

    const alert = await this.alertController.create({
      header: 'Choose Consultation Type',
      message: `How would you like to consult with ${doctor.fullName}?`,
      buttons: buttons
    });

    await alert.present();
  }

  // Book appointment
  async bookAppointment(doctor: DoctorDto, type: string) {
    const alert = await this.alertController.create({
      header: '✅ Booking Confirmed!',
      message: `Your ${type} consultation with ${doctor.fullName} has been scheduled.\n\nYou will receive a confirmation email shortly.`,
      buttons: ['OK']
    });

    await alert.present();
    await this.showToast(`Appointment booked with ${doctor.fullName}!`, 'success');
  }

  // View doctor profile
  viewDoctorProfile(doctor: DoctorDto) {
    this.router.navigate(['/doctor', doctor.id]);
  }

  // Get consultation type label
  getConsultationTypeLabel(type: string): string {
    switch (type) {
      case 'ONLINE':
        return 'Online';
      case 'IN_PERSON':
        return 'In-Person';
      case 'BOTH':
        return 'Hybrid';
      default:
        return 'Available';
    }
  }

  // Get consultation icon
  getConsultationIcon(type: string): string {
    switch (type) {
      case 'ONLINE':
        return 'videocam';
      case 'IN_PERSON':
        return 'business';
      case 'BOTH':
        return 'globe';
      default:
        return 'medical';
    }
  }

  // Get stars array for rating
  getStars(rating: number): number[] {
    const fullStars = Math.floor(rating);
    return Array(fullStars).fill(0);
  }

  // Check if has active filters
  hasActiveFilters(): boolean {
    return this.searchTerm.length > 0 || 
           this.selectedSpecialty !== 'all' || 
           this.selectedConsultationType !== 'all';
  }

  // Toggle specialty filter (placeholder for future modal)
  toggleSpecialtyFilter() {
    // Will implement filter modal later
    console.log('Toggle specialty filter');
  }

  // Toggle consultation filter (placeholder for future modal)
  toggleConsultationFilter() {
    // Will implement filter modal later
    console.log('Toggle consultation filter');
  }

  // Go back to consultation
  goBack() {
    this.router.navigate(['/tabs/consultation']);
  }

  // Show toast
  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
