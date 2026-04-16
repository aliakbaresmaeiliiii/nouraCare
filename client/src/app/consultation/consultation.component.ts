import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { DoctorService } from '../shared/services/doctor.service';
import { DoctorDto, ConsultationType } from '../shared/models/doctor.dto';
import { addIcons } from 'ionicons';
import { star } from 'ionicons/icons';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss'],
  standalone: true,
  imports:[...SHARED_STANDALONE_IMPORTS],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class ConsultationComponent implements OnInit {
  doctors: DoctorDto[] = [];
  isLoading = false;
  searchTerm = '';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private doctorService: DoctorService
  ) {
    addIcons({ star });
  }

  ngOnInit() {
    this.loadDoctors();
  }

  /** Pull-to-refresh on Consultation tab (layout). */
  async runPullToRefresh(): Promise<void> {
    await this.loadDoctors();
  }

  async onTabPullRefresh(event: Event): Promise<void> {
    const target = event.target as HTMLIonRefresherElement;
    try {
      await this.runPullToRefresh();
    } catch {
      /* non-fatal */
    } finally {
      target.complete();
    }
  }

  /** First page of doctors from API for the consultation tab preview. */
  async loadDoctors() {
    this.isLoading = true;
    this.doctorService.getDoctorsPage({ page: 1, limit: 8 }).subscribe({
      next: (res) => {
        this.doctors = res.items;
        this.isLoading = false;
      },
      error: async () => {
        this.doctors = [];
        this.isLoading = false;
        const toast = await this.toastController.create({
          message: 'Could not load doctors. Open Find Doctors to retry.',
          duration: 3000,
          color: 'warning',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  // Navigate to doctors page
  showAllDoctors() {
    this.router.navigate(['/doctors']);
  }


  // Search doctors
  searchDoctors(event: any) {
    const query = event.target.value;
    this.searchTerm = query;
    
    if (query && query.length > 2) {
      this.doctorService.searchDoctors(query).subscribe({
        next: (doctors) => {
          this.doctors = doctors;
        }
      });
    } else {
      this.loadDoctors();
    }
  }

  // Book appointment with specific doctor
  async bookWithDoctor(doctor: DoctorDto) {
    const alert = await this.alertController.create({
      header: `Book with ${doctor.fullName}`,
      message: `${doctor.specialty}\n\n${doctor.about.substring(0, 100)}...\n\nFee: $${doctor.fee || 'Contact for pricing'}`,
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

  // Show booking options for doctor
  async showBookingOptions(doctor: DoctorDto) {
    const buttons: any[] = [];
    
    if (doctor.consultationType === ConsultationType.ONLINE || doctor.consultationType === ConsultationType.BOTH) {
      buttons.push({
        text: '💻 Online Consultation',
        handler: () => {
          this.bookAppointment(doctor, 'online');
        }
      });
    }
    
    if (doctor.consultationType === ConsultationType.IN_PERSON || doctor.consultationType === ConsultationType.BOTH) {
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
      header: 'Select Time Slot',
      message: `Book ${type} consultation with ${doctor.fullName}`,
      inputs: [
        {
          name: 'timeSlot',
          type: 'radio',
          label: 'Today - 2:00 PM',
          value: 'today_2pm',
          checked: true
        },
        {
          name: 'timeSlot',
          type: 'radio',
          label: 'Today - 4:30 PM',
          value: 'today_430pm'
        },
        {
          name: 'timeSlot',
          type: 'radio',
          label: 'Tomorrow - 10:00 AM',
          value: 'tomorrow_10am'
        },
        {
          name: 'timeSlot',
          type: 'radio',
          label: 'Tomorrow - 2:00 PM',
          value: 'tomorrow_2pm'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm Booking',
          handler: (data) => {
            this.confirmBooking(doctor, type, data.timeSlot);
          }
        }
      ]
    });

    await alert.present();
  }

  // Confirm booking
  async confirmBooking(doctor: DoctorDto, type: string, timeSlot: string) {
    const timeLabels: { [key: string]: string } = {
      'today_2pm': 'Today at 2:00 PM',
      'today_430pm': 'Today at 4:30 PM',
      'tomorrow_10am': 'Tomorrow at 10:00 AM',
      'tomorrow_2pm': 'Tomorrow at 2:00 PM'
    };

    const alert = await this.alertController.create({
      header: '✅ Booking Confirmed!',
      message: `
        <div style="text-align: left;">
          <p><strong>Doctor:</strong> ${doctor.fullName}</p>
          <p><strong>Specialty:</strong> ${doctor.specialty}</p>
          <p><strong>Type:</strong> ${type === 'online' ? 'Online Consultation' : 'In-Person Visit'}</p>
          <p><strong>Time:</strong> ${timeLabels[timeSlot]}</p>
          <p><strong>Fee:</strong> $${doctor.fee || 'Contact for pricing'}</p>
          ${doctor.location ? `<p><strong>Location:</strong> ${doctor.location}</p>` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Add to Calendar',
          handler: () => {
            this.showToast('Appointment added to calendar!', 'success');
          }
        },
        {
          text: 'Done',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
    await this.showToast(`Appointment booked with ${doctor.fullName}!`, 'success');
  }

  // View doctor profile
  async viewDoctorProfile(doctor: DoctorDto) {
    this.router.navigate(['/doctor', doctor.id]);
    // const alert = await this.alertController.create({
    //   header: doctor.fullName,
    //   message: `
    //     <div style="text-align: left;">
    //       <p><strong>Specialty:</strong> ${doctor.specialty}</p>
    //       <p><strong>Experience:</strong> ${doctor.experienceYears} years</p>
    //       ${doctor.rating ? `<p><strong>Rating:</strong> ${doctor.rating}/5 ⭐</p>` : ''}
    //       ${doctor.clinicName ? `<p><strong>Clinic:</strong> ${doctor.clinicName}</p>` : ''}
    //       ${doctor.location ? `<p><strong>Location:</strong> ${doctor.location}</p>` : ''}
    //       <p><strong>About:</strong></p>
    //       <p style="font-style: italic;">${doctor.about}</p>
    //       <p><strong>Consultation Fee:</strong> $${doctor.fee || 'Contact for pricing'}</p>
    //       <p><strong>Available:</strong> ${this.getConsultationTypeLabel(doctor.consultationType)}</p>
    //     </div>
    //   `,
    //   buttons: [
    //     {
    //       text: 'Book Appointment',
    //       handler: () => {
    //         this.bookWithDoctor(doctor);
    //       }
    //     },
    //     {
    //       text: 'Contact',
    //       handler: () => {
    //         this.contactDoctor(doctor);
    //       }
    //     },
    //     {
    //       text: 'Close',
    //       role: 'cancel'
    //     }
    //   ]
    // });

    // await alert.present();
  }

  // Contact doctor
  async contactDoctor(doctor: DoctorDto) {
    const buttons: any[] = [];
    
    if (doctor.contactEmail) {
      buttons.push({
        text: '📧 Email',
        handler: () => {
          window.open(`mailto:${doctor.contactEmail}`, '_blank');
        }
      });
    }
    
    if (doctor.contactPhone) {
      buttons.push({
        text: '📞 Phone',
        handler: () => {
          window.open(`tel:${doctor.contactPhone}`, '_blank');
        }
      });
    }
    
    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });

    const alert = await this.alertController.create({
      header: `Contact ${doctor.fullName}`,
      message: 'How would you like to contact this doctor?',
      buttons: buttons
    });

    await alert.present();
  }

  // Get consultation type label
  getConsultationTypeLabel(type: ConsultationType): string {
    switch (type) {
      case ConsultationType.ONLINE:
        return 'Online Only';
      case ConsultationType.IN_PERSON:
        return 'In-Person Only';
      case ConsultationType.BOTH:
        return 'Online & In-Person';
      default:
        return 'Contact for details';
    }
  }

  // Quick Booking Methods
  async bookDoctorAppointment() {
    const alert = await this.alertController.create({
      header: '👩‍⚕️ Book Doctor Appointment',
      message: 'Choose your preferred appointment type:',
      inputs: [
        {
          name: 'appointmentType',
          type: 'radio',
          label: 'Prenatal Checkup',
          value: 'prenatal',
          checked: true
        },
        {
          name: 'appointmentType',
          type: 'radio',
          label: 'Ultrasound',
          value: 'ultrasound'
        },
        {
          name: 'appointmentType',
          type: 'radio',
          label: 'Emergency Consultation',
          value: 'emergency'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Continue',
          handler: (data) => {
            this.showBookingConfirmation('Doctor Appointment', data.appointmentType);
          }
        }
      ]
    });

    await alert.present();
  }

  async bookNutritionConsultation() {
    const alert = await this.alertController.create({
      header: '🥗 Nutrition Consultation',
      message: 'What would you like to focus on?',
      inputs: [
        {
          name: 'nutritionFocus',
          type: 'radio',
          label: 'Pregnancy Diet Plan',
          value: 'pregnancy_diet',
          checked: true
        },
        {
          name: 'nutritionFocus',
          type: 'radio',
          label: 'Supplements & Vitamins',
          value: 'supplements'
        },
        {
          name: 'nutritionFocus',
          type: 'radio',
          label: 'Weight Management',
          value: 'weight_management'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Book Now',
          handler: (data) => {
            this.showBookingConfirmation('Nutrition Consultation', data.nutritionFocus);
          }
        }
      ]
    });

    await alert.present();
  }

  async bookFitnessConsultation() {
    const alert = await this.alertController.create({
      header: '🏃‍♀️ Fitness Consultation',
      message: 'Choose your fitness focus:',
      inputs: [
        {
          name: 'fitnessFocus',
          type: 'radio',
          label: 'Prenatal Yoga',
          value: 'prenatal_yoga',
          checked: true
        },
        {
          name: 'fitnessFocus',
          type: 'radio',
          label: 'Safe Exercises',
          value: 'safe_exercises'
        },
        {
          name: 'fitnessFocus',
          type: 'radio',
          label: 'Postpartum Recovery',
          value: 'postpartum'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Book Now',
          handler: (data) => {
            this.showBookingConfirmation('Fitness Consultation', data.fitnessFocus);
          }
        }
      ]
    });

    await alert.present();
  }

  async bookMentalHealthSupport() {
    const alert = await this.alertController.create({
      header: '💙 Mental Health Support',
      message: 'What type of support do you need?',
      inputs: [
        {
          name: 'mentalHealthType',
          type: 'radio',
          label: 'Pregnancy Anxiety',
          value: 'anxiety',
          checked: true
        },
        {
          name: 'mentalHealthType',
          type: 'radio',
          label: 'Depression Support',
          value: 'depression'
        },
        {
          name: 'mentalHealthType',
          type: 'radio',
          label: 'Stress Management',
          value: 'stress'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Book Now',
          handler: (data) => {
            this.showBookingConfirmation('Mental Health Support', data.mentalHealthType);
          }
        }
      ]
    });

    await alert.present();
  }

  // Specialist Booking
  async bookSpecialist(specialistId: string) {
    const specialists = {
      'sarah': { name: 'Dr. Sarah Johnson', specialty: 'Obstetrician & Gynecologist' },
      'michael': { name: 'Dr. Michael Chen', specialty: 'Pregnancy Nutritionist' },
      'emily': { name: 'Dr. Emily Rodriguez', specialty: 'Prenatal Fitness Expert' },
      'david': { name: 'Dr. David Wilson', specialty: 'Mental Health Specialist' }
    };

    const specialist = specialists[specialistId as keyof typeof specialists];
    
    const alert = await this.alertController.create({
      header: `Book with ${specialist.name}`,
      message: `${specialist.specialty}\n\nChoose your preferred time:`,
      inputs: [
        {
          name: 'appointmentTime',
          type: 'radio',
          label: 'Today - 2:00 PM',
          value: 'today_2pm',
          checked: true
        },
        {
          name: 'appointmentTime',
          type: 'radio',
          label: 'Today - 4:30 PM',
          value: 'today_430pm'
        },
        {
          name: 'appointmentTime',
          type: 'radio',
          label: 'Tomorrow - 10:00 AM',
          value: 'tomorrow_10am'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm Booking',
          handler: (data) => {
            this.showBookingConfirmation(specialist.name, data.appointmentTime);
          }
        }
      ]
    });

    await alert.present();
  }

  // Consultation Type Selection
  async selectConsultationType(type: string) {
    const types = {
      'prenatal': { name: 'Prenatal Care', price: '$150', duration: '30-45 min' },
      'nutrition': { name: 'Nutrition Planning', price: '$120', duration: '45-60 min' },
      'fitness': { name: 'Exercise Guidance', price: '$100', duration: '30-40 min' },
      'mental': { name: 'Mental Health', price: '$180', duration: '50-60 min' }
    };

    const consultationType = types[type as keyof typeof types];
    
    const alert = await this.alertController.create({
      header: consultationType.name,
      message: `Duration: ${consultationType.duration}\nPrice: ${consultationType.price}\n\nWould you like to book this consultation?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Book Now',
          handler: () => {
            this.showBookingConfirmation(consultationType.name, 'standard');
          }
        }
      ]
    });

    await alert.present();
  }

  // Appointment Management
  async viewAppointment(appointmentId: string) {
    const alert = await this.alertController.create({
      header: 'Appointment Details',
      message: 'View your appointment details and manage your booking.',
      buttons: [
        {
          text: 'View Details',
          handler: () => {
            this.showToast('Opening appointment details...', 'success');
          }
        },
        {
          text: 'Cancel Appointment',
          handler: () => {
            this.cancelAppointment(appointmentId);
          }
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async rescheduleAppointment(appointmentId: string) {
    const alert = await this.alertController.create({
      header: 'Reschedule Appointment',
      message: 'Choose a new time for your appointment:',
      inputs: [
        {
          name: 'newTime',
          type: 'radio',
          label: 'Tomorrow - 9:00 AM',
          value: 'tomorrow_9am',
          checked: true
        },
        {
          name: 'newTime',
          type: 'radio',
          label: 'Tomorrow - 2:00 PM',
          value: 'tomorrow_2pm'
        },
        {
          name: 'newTime',
          type: 'radio',
          label: 'Friday - 10:00 AM',
          value: 'friday_10am'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reschedule',
          handler: (data) => {
            this.showToast('Appointment rescheduled successfully!', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  async cancelAppointment(appointmentId: string) {
    const alert = await this.alertController.create({
      header: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment?',
      buttons: [
        {
          text: 'No, Keep It',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          handler: () => {
            this.showToast('Appointment cancelled successfully!', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  // Emergency Contact
  async callEmergency() {
    const alert = await this.alertController.create({
      header: 'Emergency Contact',
      message: 'This will call emergency services (911). Are you sure?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Call Emergency',
          handler: () => {
            this.showToast('Calling emergency services...', 'warning');
            // In a real app, you would use the device's call functionality
            // window.location.href = 'tel:911';
          }
        }
      ]
    });

    await alert.present();
  }

  // Quick Menu
  async openQuickMenu() {
    const actionSheet = await this.alertController.create({
      header: 'Quick Actions',
      buttons: [
        {
          text: '📝 Book New Appointment',
          handler: () => {
            this.bookDoctorAppointment();
          }
        },
        {
          text: '📅 View Calendar',
          handler: () => {
            this.showToast('Opening calendar...', 'success');
          }
        },
        {
          text: '📞 Contact Support',
          handler: () => {
            this.showToast('Opening support chat...', 'success');
          }
        },
        {
          text: '❌ Cancel',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  // Notifications
  async openNotifications() {
    const alert = await this.alertController.create({
      header: 'Notifications',
      message: 'You have 2 new notifications:\n\n• Appointment reminder tomorrow at 10:00 AM\n• New message from Dr. Sarah Johnson',
      buttons: [
        {
          text: 'View All',
          handler: () => {
            this.showToast('Opening notifications...', 'success');
          }
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  // Utility Methods
  async showBookingConfirmation(type: string, details: string) {
    const alert = await this.alertController.create({
      header: '✅ Booking Confirmed!',
      message: `Your ${type} appointment has been scheduled successfully.\n\nDetails: ${details}\n\nYou will receive a confirmation email shortly.`,
      buttons: [
        {
          text: 'View Appointment',
          handler: () => {
            this.showToast('Opening appointment details...', 'success');
          }
        },
        {
          text: 'Done',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
    await this.showToast('Appointment booked successfully!', 'success');
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
