import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  pencil,
  star,
  location,
  refresh,
  checkmark,
  camera,
  person,
  heart,
  calendar,
  close,
  sparkles,
  people,
  heartCircle,
  heartDislike,
} from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../shared/services/user';
import { ActivatedRoute, Router } from '@angular/router';
import { UserInfoService } from '../shared/services/user-info.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HomeDataService } from '../home/services/home-data.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EditProfileComponent implements OnInit {
  userService = inject(User);
  userInfoService = inject(UserInfoService);
  route = inject(ActivatedRoute);
  private router = inject(Router);
  private imageUrlService = inject(ImageUrlService);
  profileImage: string | null = null;
  selectedProfile: File | null = null;
  showCropper = false;
  zoom = 1;
  private imageBitmap: ImageBitmap | null = null;
  @ViewChild('cropCanvas') cropCanvas!: ElementRef<HTMLCanvasElement>;
  userId = 0;
  private homeService = inject(HomeDataService);

  @ViewChild(IonModal) modal!: IonModal;

  statusOptions: { 
    label: string; 
    value: string; 
    icon: string; 
    description: string;
    color: string;
  }[] = [
    {
      label: 'Planning Pregnancy',
      value: 'PLANNING_PREGNANCY',
      icon: 'sparkles',
      description: 'Actively trying to conceive',
      color: '#8b5cf6'
    },
    {
      label: 'Pregnant',
      value: 'PREGNANT',
      icon: 'heart',
      description: 'Currently expecting a baby',
      color: '#ec4899'
    },
    {
      label: 'Has Child',
      value: 'HAS_CHILD',
      icon: 'people',
      description: 'Already have children',
      color: '#10b981'
    }
  ];

  // Reproductive Status Options
  reproductiveStatusOptions: {
    label: string;
    value: string;
    emoji: string;
    color: string;
  }[] = [
    {
      label: 'I\'m pregnant',
      value: 'PREGNANT',
      emoji: '🩷',
      color: '#ff6b9d'
    },
    {
      label: 'I\'m planning to get pregnant',
      value: 'PLANNING_PREGNANCY',
      emoji: '🌸',
      color: '#ff8fab'
    },
    {
      label: 'I\'m not pregnant',
      value: 'NOT_PREGNANT',
      emoji: '💧',
      color: '#8bc5ff'
    }
  ];

  isEditingReproductiveStatus = false;
  currentReproductiveStatus: string | null = null;

  constructor(private fb: FormBuilder) {
    addIcons({
      pencil,
      star,
      location,
      refresh,
      checkmark,
      camera,
      person,
      heart,
      calendar,
      close,
      sparkles,
      people,
      heartCircle,
      heartDislike,
    });
  }

  form: FormGroup = this.fb.group({
    profileImage: [''],
    status: [null],
    fullName: [''],
    birthday: [''],
    email: [''],
  });

  private loadUserDataFromAPI() {
    try {
      const currentUserInfo = this.userInfoService.getCurrentUserInfo();
      if (currentUserInfo?.data?.id) {
        this.fetchUserDataAndOnboardingData(currentUserInfo.data.id);
      } else {
        console.error('No user info available');
      }
    } catch (error) {
    }
  }

  private fetchUserDataAndOnboardingData(userId: number) {
    const userData$ = this.userService.getUser(String(userId));
    const onboardingData$ = this.userInfoService.getUserOnboardingData(userId);

    forkJoin({
      userData: userData$,
      onboardingData: onboardingData$.pipe(
        catchError(() =>
          of({
            cycleLength: 28,
            periodLength: 5,
            lastPeriodDate: null,
          })
        )
      ),
    }).subscribe({
      next: (data) => {
        const mergedData = {
          fullName: data.userData.data?.fullName || '',
          email: data.userData.data?.email || '',
          birthday: data.userData.data?.birthday || '',
          profileImage: data.userData.data?.profileImage || '',
          status: data.userData?.data.status || null,
        };

        this.patchFormWithUserData(mergedData);
      },
      error: (error) => {
        console.error('Failed to load user data:', error);
      },
    });
  }

  private patchFormWithUserData(userData: any) {
    const patch: any = {
      fullName: userData?.fullName ?? '',
      email: userData?.email ?? '',
      birthday: userData?.birthday ?? '',
      profileImage: userData?.profileImage ?? '',
      status: userData?.status ?? null,
    };

    this.form.patchValue(patch);
    this.profileImage = this.imageUrlService.getImageUrl(userData?.profileImage);

    setTimeout(() => {
      this.checkFormControlState();
    }, 100);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size should be less than 5MB');
        return;
      }

      // Store the file so we can upload it
      this.selectedProfile = file;

      // Immediately show a local preview without cropping
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.profileImage = result;
        this.form.patchValue({ profileImage: result });
      };
      reader.readAsDataURL(file);

      // Upload the original image file directly (no cropper)
      const currentUserInfo = this.userInfoService.getCurrentUserInfo();
      const id = currentUserInfo?.userId;
      if (!id) {
        console.error('No user ID available');
        return;
      }

      this.userService.uploadProfileImage(String(id), file).subscribe({
        next: (res: any) => {
          // Replace local preview with server URL
          this.profileImage = this.imageUrlService.getImageUrl(res.url);
          this.form.patchValue({ profileImage: res.url });

          try {
            const store = JSON.parse(localStorage.getItem('userInfo') || '{}');
            store.user = { ...(store.user || {}), profileImage: res.url };
            localStorage.setItem('userInfo', JSON.stringify(store));
          } catch (error) {
            console.error('Error updating local storage:', error);
          }
        },
        error: (error: any) => {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
        },
      });
    }
  }


  handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
  }

  onBirthdayChange(event: any) {
    const date = event.detail?.value;
    this.form.patchValue({ birthday: date });
  }

  onSubmit() {
    const formValues = this.form.value;
    const currentUserInfo = this.userInfoService.getCurrentUserInfo();
    const id = currentUserInfo.data?.id;
    if (!id) {
      console.error('No user ID available');
      alert('User not found. Please try again.');
      return;
    }

    this.showLoadingAlert('Saving profile...');

    try {
      const store = JSON.parse(localStorage.getItem('userInfo') || '{}');
      store.user = {
        ...(store.user || {}),
        fullName: formValues.fullName,
        email: formValues.email,
        birthday: formValues.birthday,
      };
      localStorage.setItem('userInfo', JSON.stringify(store));
    } catch {}

    const payload: any = {
      fullName: formValues.fullName,
      email: formValues.email,
      birthday: formValues.birthday,
      profileImage: formValues.profileImage,
      status: formValues.status,
    };

    this.userService.updateUserInfo(String(id), payload).subscribe({
      next: (res: any) => {
        this.updateUserInfoService(formValues);
        this.showSuccessAlert('Profile updated successfully!');
      },
      error: (error: any) => {
        console.error('Error updating profile:', error);
        this.showErrorAlert('Failed to update profile. Please try again.');
      },
    });
  }

  private updateUserInfoService(formValues: any) {
    const currentUserInfo = this.userInfoService.getCurrentUserInfo();
    if (currentUserInfo) {
      const updatedUserInfo = {
        ...currentUserInfo,
        updatedAt: new Date().toISOString(),
      };

      console.log('🔄 Updating UserInfoService with new data:', updatedUserInfo);
      this.userInfoService.userInfo.set(updatedUserInfo);
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
    } else {
      console.log('⚠️ No current user info found, creating new one');
      const newUserInfo = {
        id: 1,
        userId: 1,
        pregnancyStatus: 'tracking' as const,
        lastPeriodDate: null,
        cycleLength: 28,
        periodLength: 5,
        healthGoals: [],
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('🆕 Creating new user info:', newUserInfo);
      this.userInfoService.userInfo.set(newUserInfo);
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
    }
  }

 

  setStatus(statusValue: string | null): void {
    this.form.patchValue({ status: statusValue });
    
    // Navigate to pregnancy planning when "Planning Pregnancy" is selected
    if (statusValue === 'PLANNING_PREGNANCY') {
      this.navigateToPregnancyPlanning();
    }
  }

  navigateToPregnancyPlanning(): void {
    this.router.navigate(['/pregnancy-planning']);
  }

  checkFormControlState(): void {
  }

  checkCropperState(): void {
    console.log('Cropper state:', {
      showCropper: this.showCropper,
      imageBitmap: !!this.imageBitmap,
      canvas: !!this.cropCanvas,
      canvasElement: !!this.cropCanvas?.nativeElement,
    });

    if (this.cropCanvas?.nativeElement) {
      const canvas = this.cropCanvas.nativeElement;
      console.log('Canvas details:', {
        width: canvas.width,
        height: canvas.height,
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight,
        visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0,
      });
    }
  }

 

  testImageDisplay(): void {
    console.log('Testing image display...');
    console.log('Current profileImage:', this.profileImage);
    console.log('Form profileImage value:', this.form.get('profileImage')?.value);

    const testImage = 'https://ionicframework.com/docs/img/demos/avatar.svg';
    this.profileImage = testImage;
    this.form.patchValue({ profileImage: testImage });

    console.log('Test image set:', this.profileImage);
  }

  checkImageVisibility(): void {
    const imgElement = document.querySelector('.avatar-image') as HTMLImageElement;
    if (imgElement) {
      console.log('Image element found:', {
        src: imgElement.src,
        width: imgElement.width,
        height: imgElement.height,
        naturalWidth: imgElement.naturalWidth,
        naturalHeight: imgElement.naturalHeight,
        style: imgElement.style.cssText,
        visible: imgElement.offsetWidth > 0 && imgElement.offsetHeight > 0,
      });
    } else {
      console.log('Image element not found');
    }
  }

  getCurrentStatus(): string | null {
    return this.form.get('status')?.value;
  }

  isStatusSelected(statusValue: string): boolean {
    const currentStatus = this.form.get('status')?.value;
    if (currentStatus === null) {
      return false;
    }
    return currentStatus === statusValue;
  }


  resetForm(): void {
    this.form.reset();
  }

  initializeFormWithDefaults(): void {
    console.log('Initializing form with defaults...');
    this.form.patchValue({
      status: null,
      fullName: '',
      email: '',
      birthday: '',
      profileImage: '',
    });
    console.log('Form after initialization:', this.form.value);
  }

  triggerFormInit(): void {
    this.setStatus('PLANNING_PREGNANCY');
    setTimeout(() => {
      this.checkFormControlState();
    }, 100);
  }

  ngOnInit(): void {
    this.userId = this.homeService.getCurrentUserId();
    this.loadUserDataFromAPI();
  }

  // Reproductive Status Methods
  toggleReproductiveStatusEdit(): void {
    this.isEditingReproductiveStatus = !this.isEditingReproductiveStatus;
  }

  getCurrentReproductiveStatus(): string | null {
    return this.currentReproductiveStatus;
  }

  isReproductiveStatusSelected(statusValue: string): boolean {
    return this.currentReproductiveStatus === statusValue;
  }

  setReproductiveStatus(statusValue: string): void {
    this.currentReproductiveStatus = statusValue;
  }

  saveReproductiveStatus(): void {
    if (this.currentReproductiveStatus) {
      // Save the reproductive status to the user profile
      const currentUserInfo = this.userInfoService.getCurrentUserInfo();
      const id = currentUserInfo?.userId;
      
      if (id) {
        // Get current form values to preserve existing data
        const formValues = this.form.value;
        const payload: any = {
          fullName: formValues.fullName || '',
          email: formValues.email || '',
          birthday: formValues.birthday || '',
          profileImage: formValues.profileImage || '',
          status: formValues.status || null,
          reproductiveStatus: this.currentReproductiveStatus
        };
        
        this.userService.updateUserInfo(String(id), payload).subscribe({
          next: (res: any) => {
            this.isEditingReproductiveStatus = false;
            this.showSuccessAlert('Reproductive status updated successfully!');
          },
          error: (error: any) => {
            console.error('Error updating reproductive status:', error);
            this.showErrorAlert('Failed to update reproductive status. Please try again.');
          },
        });
      } else {
        this.isEditingReproductiveStatus = false;
        this.showSuccessAlert('Reproductive status saved!');
      }
    }
  }

  getSelectedReproductiveStatusEmoji(): string {
    if (!this.currentReproductiveStatus) return '❓';
    
    const selectedOption = this.reproductiveStatusOptions.find(option => option.value === this.currentReproductiveStatus);
    return selectedOption?.emoji || '❓';
  }

  getSelectedReproductiveStatusLabel(): string {
    if (!this.currentReproductiveStatus) return 'Not selected';
    
    const selectedOption = this.reproductiveStatusOptions.find(option => option.value === this.currentReproductiveStatus);
    return selectedOption?.label || 'Not selected';
  }

  showLoadingAlert(message: string): void {
    const loadingDialog = document.createElement('div');
    loadingDialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    loadingDialog.innerHTML = `
      <div style="
        background: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      ">
        <p style="margin: 0 0 16px 0; color: #374151; font-weight: 500;">${message}</p>
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    `;
    document.body.appendChild(loadingDialog);
    setTimeout(() => {
      if (loadingDialog.parentNode) {
        loadingDialog.remove();
      }
    }, 3000);
  }

  showSuccessAlert(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }

  showErrorAlert(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }
}
