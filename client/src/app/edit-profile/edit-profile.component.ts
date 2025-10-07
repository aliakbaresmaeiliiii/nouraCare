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
import { SharedModule } from '../shared/shared-module';
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
  imports: [SharedModule],
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
    status: [null, Validators.required],
    name: [''],
    birthday: [''],
    email: [''],
  });

  private loadUserDataFromAPI() {
    try {
      const currentUserInfo = this.userInfoService.getCurrentUserInfo();
      if (currentUserInfo?.userId) {
        this.fetchUserDataAndOnboardingData(currentUserInfo.userId);
      } else {
        console.error('No user info available');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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
        console.log('User table data:', data.userData);
        console.log('Onboarding data:', data.onboardingData);

        const mergedData = {
          name: data.userData?.name || '',
          email: data.userData?.email || '',
          birthday: data.userData?.birthday || '',
          profileImage: data.userData?.profileImage || '',
          status: data.userData?.status || null,
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
      name: userData?.name ?? '',
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

      this.selectedProfile = file;
      console.log('File validated, processing...');

      if (typeof createImageBitmap === 'function') {
        try {
          console.log('Using createImageBitmap...');
          createImageBitmap(file)
            .then((bmp) => {
              console.log('ImageBitmap created:', bmp.width, 'x', bmp.height);
              this.imageBitmap = bmp;
              this.showCropper = true;

              setTimeout(() => {
                console.log('Modal should be open, rendering crop...');
                this.renderCrop();
              }, 300);
            })
            .catch((error) => {
              console.error('Error creating image bitmap:', error);
              this.fallbackImageProcessing(file);
            });
        } catch (error) {
          console.error('Error in createImageBitmap:', error);
          this.fallbackImageProcessing(file);
        }
      } else {
        console.log('Using fallback image processing...');
        this.fallbackImageProcessing(file);
      }
    }
  }

  private fallbackImageProcessing(file: File) {
    console.log('Using fallback image processing...');
    const reader = new FileReader();

    reader.onload = (e) => {
      console.log('File read successfully, creating image...');
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded:', img.width, 'x', img.height);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          this.imageBitmap = canvas as any;
          this.showCropper = true;

          setTimeout(() => {
            console.log('Rendering crop with fallback...');
            this.renderCrop();
          }, 100);
        }
      };
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      console.error('Error reading file');
      alert('Error reading image file. Please try again.');
    };

    reader.readAsDataURL(file);
  }

  private renderCrop() {
    if (
      !this.cropCanvas ||
      !this.cropCanvas.nativeElement ||
      !this.imageBitmap
    ) {
      console.error('Cannot render crop: missing elements', {
        canvas: !!this.cropCanvas,
        canvasElement: !!this.cropCanvas?.nativeElement,
        imageBitmap: !!this.imageBitmap,
      });
      return;
    }

    const canvas = this.cropCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Cannot get canvas context');
      return;
    }

    const size = 256;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const iw = this.imageBitmap.width;
    const ih = this.imageBitmap.height;

    const scaleX = size / iw;
    const scaleY = size / ih;
    const scale = Math.min(scaleX, scaleY) * this.zoom;

    const dw = iw * scale;
    const dh = ih * scale;

    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;

    console.log('Rendering crop:', {
      iw,
      ih,
      scale,
      dw,
      dh,
      dx,
      dy,
      zoom: this.zoom,
      scaleX,
      scaleY,
      finalScale: scale,
    });

    try {
      ctx.drawImage(this.imageBitmap, dx, dy, dw, dh);
      console.log('Image rendered successfully');

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, size, size);
    } catch (error) {
      console.error('Error drawing image to canvas:', error);
    }
  }

  onZoom(ev: any) {
    this.zoom = Number(ev.detail.value ?? 1);
    this.renderCrop();
  }

  closeCropper() {
    console.log('Closing cropper...');
    this.showCropper = false;
    this.imageBitmap = null;

    const fileInput = document.getElementById('fileeInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', 0.9)
    );
  }

  compareWith(o1: any, o2: any): boolean {
    if (o1 && o2) {
      if (typeof o1 === 'object' && typeof o2 === 'object') {
        return o1.value === o2.value;
      } else if (typeof o1 === 'object' && typeof o2 === 'string') {
        return o1.value === o2;
      } else if (typeof o1 === 'string' && typeof o2 === 'object') {
        return o1 === o2.value;
      } else {
        return o1 === o2;
      }
    }
    return false;
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
    const id = currentUserInfo?.userId;

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
        name: formValues.name,
        email: formValues.email,
        birthday: formValues.birthday,
      };
      localStorage.setItem('userInfo', JSON.stringify(store));
    } catch {}

    const payload: any = {
      name: formValues.name,
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

  async confirmCrop() {
    try {
      if (!this.cropCanvas?.nativeElement) {
        console.error('Crop canvas not available');
        return;
      }

      console.log('Starting crop confirmation...');
      const canvas = this.cropCanvas.nativeElement;

      console.log('Canvas state:', {
        width: canvas.width,
        height: canvas.height,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight,
      });

      const blob = await this.canvasToBlob(canvas);
      console.log('Blob created:', blob.size, 'bytes, type:', blob.type);

      const currentUserInfo = this.userInfoService.getCurrentUserInfo();
      const id = currentUserInfo?.userId;
      if (!id) {
        console.error('No user ID available');
        alert('User not found. Please try again.');
        return;
      }

      console.log('Uploading image...');
      this.userService.uploadProfileImage(String(id), blob).subscribe({
        next: (res: any) => {
          console.log('Upload successful:', res);

          this.profileImage = this.imageUrlService.getImageUrl(res.url);
          this.form.patchValue({ profileImage: res.url });

          console.log('Profile image updated:', this.profileImage);

          try {
            const store = JSON.parse(localStorage.getItem('userInfo') || '{}');
            store.user = { ...(store.user || {}), profileImage: res.url };
            localStorage.setItem('userInfo', JSON.stringify(store));
            console.log('Local storage updated');
          } catch (error) {
            console.error('Error updating local storage:', error);
          }

          this.closeCropper();
          this.showSuccessAlert('Profile picture updated successfully!');
        },
        error: (error: any) => {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
          this.closeCropper();
        },
      });
    } catch (error) {
      console.error('Error in confirmCrop:', error);
      alert('Error processing image. Please try again.');
      this.closeCropper();
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

  forceRenderCrop(): void {
    console.log('Forcing crop re-render...');
    if (this.showCropper && this.imageBitmap) {
      setTimeout(() => {
        this.renderCrop();
      }, 100);
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

  getSelectedStatusIcon(): string {
    const currentStatus = this.getCurrentStatus();
    if (!currentStatus) return 'help-circle';
    
    const selectedOption = this.statusOptions.find(option => option.value === currentStatus);
    return selectedOption?.icon || 'help-circle';
  }

  getSelectedStatusLabel(): string {
    const currentStatus = this.getCurrentStatus();
    if (!currentStatus) return 'None selected';
    
    const selectedOption = this.statusOptions.find(option => option.value === currentStatus);
    return selectedOption?.label || 'None selected';
  }

  resetForm(): void {
    this.form.reset();
  }

  initializeFormWithDefaults(): void {
    console.log('Initializing form with defaults...');
    this.form.patchValue({
      status: null,
      name: '',
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
