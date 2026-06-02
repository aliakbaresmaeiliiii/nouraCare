import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { DoctorService } from '../shared/services/doctor.service';
import { ConsultationType, CreateDoctorDto } from '../shared/models/doctor.dto';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { TranslationService } from '../shared/services/translation.service';

@Component({
  selector: 'app-create-doctor',
  templateUrl: './create-doctor.component.html',
  styleUrls: ['./create-doctor.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS]
})
export class CreateDoctorComponent implements OnInit {
  doctorForm!: FormGroup;
  isLoading = false;
  consultationTypes: { value: ConsultationType; label: string }[] = [];
  specialties: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private doctorService: DoctorService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private translation: TranslationService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadFormData();
  }

  private initializeForm() {
    this.doctorForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      specialty: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      experienceYears: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
      about: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      rating: [null, [Validators.min(0), Validators.max(5)]],
      profileImageUrl: [''],
      clinicName: ['', [Validators.maxLength(200)]],
      location: ['', [Validators.maxLength(200)]],
      contactEmail: ['', [Validators.email]],
      contactPhone: [''],
      consultationType: [ConsultationType.BOTH, [Validators.required]],
      fee: [null, [Validators.min(0)]]
    });
  }

  private loadFormData() {
    this.consultationTypes = this.doctorService.getConsultationTypes();
    this.specialties = this.doctorService.getSpecialties();
  }

  // Form getters for easy access
  get fullName() { return this.doctorForm.get('fullName'); }
  get specialty() { return this.doctorForm.get('specialty'); }
  get experienceYears() { return this.doctorForm.get('experienceYears'); }
  get about() { return this.doctorForm.get('about'); }
  get rating() { return this.doctorForm.get('rating'); }
  get profileImageUrl() { return this.doctorForm.get('profileImageUrl'); }
  get clinicName() { return this.doctorForm.get('clinicName'); }
  get location() { return this.doctorForm.get('location'); }
  get contactEmail() { return this.doctorForm.get('contactEmail'); }
  get contactPhone() { return this.doctorForm.get('contactPhone'); }
  get consultationType() { return this.doctorForm.get('consultationType'); }
  get fee() { return this.doctorForm.get('fee'); }

  // Handle form submission
  async onSubmit() {
    if (this.doctorForm.valid) {
      this.isLoading = true;
      
      try {
        const doctorData: CreateDoctorDto = this.doctorForm.value;
        
        // Remove empty optional fields
        Object.keys(doctorData).forEach(key => {
          if (doctorData[key as keyof CreateDoctorDto] === '' || 
              doctorData[key as keyof CreateDoctorDto] === null) {
            delete doctorData[key as keyof CreateDoctorDto];
          }
        });

        await this.doctorService.createDoctor(doctorData).toPromise();
        
        await this.showSuccessAlert();
        this.router.navigate(['/tabs/consultation']);
        
      } catch (error) {
        console.error('Error creating doctor:', error);
        await this.showToast(this.translation.translate('createDoctor.toast.createFailed'), 'danger');
      } finally {
        this.isLoading = false;
      }
    } else {
      await this.showToast(this.translation.translate('createDoctor.toast.fillRequired'), 'warning');
      this.markFormGroupTouched();
    }
  }

  // Mark all form fields as touched to show validation errors
  private markFormGroupTouched() {
    Object.keys(this.doctorForm.controls).forEach(key => {
      const control = this.doctorForm.get(key);
      control?.markAsTouched();
    });
  }

  // Handle specialty selection from dropdown
  onSpecialtyChange(event: any) {
    this.doctorForm.patchValue({ specialty: event.detail.value });
  }

  // Handle consultation type change
  onConsultationTypeChange(event: any) {
    this.doctorForm.patchValue({ consultationType: event.detail.value });
  }

  // Reset form
  resetForm() {
    this.doctorForm.reset();
    this.initializeForm();
  }

  // Show success alert
  private async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: this.translation.translate('createDoctor.toast.profileCreatedTitle'),
      message: this.translation.translate('createDoctor.toast.profileCreated'),
      buttons: [
        {
          text: this.translation.translate('createDoctor.toast.viewAllDoctors'),
          handler: () => {
            this.router.navigate(['/tabs/consultation']);
          }
        },
        {
          text: this.translation.translate('createDoctor.toast.createAnother'),
          handler: () => {
            this.resetForm();
          }
        }
      ]
    });

    await alert.present();
  }

  // Show toast message
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Navigation methods
  goBack() {
    this.router.navigate(['/tabs/consultation']);
  }

  // Get error message for form field
  getFieldError(fieldName: string): string {
    const field = this.doctorForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} cannot exceed ${field.errors['max'].max}`;
      if (field.errors['email']) return 'Please enter a valid email address';
    }
    return '';
  }

  // Check if field has error
  hasFieldError(fieldName: string): boolean {
    const field = this.doctorForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}
