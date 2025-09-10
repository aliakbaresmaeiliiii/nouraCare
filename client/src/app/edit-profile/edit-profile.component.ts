import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { OverlayEventDetail } from '@ionic/core/components';
import { addIcons } from 'ionicons';
import { pencil, star, location, refresh, checkmark, camera, person, heart, calendar, close } from 'ionicons/icons';
import { SharedModule } from '../shared/shared-module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../shared/services/user';
import { ActivatedRoute } from '@angular/router';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { ImageUrlService } from '../shared/services/image-url.service';
@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  imports: [SharedModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EditProfileComponent implements OnInit {
  userService = inject(User);
  cycleSettings = inject(CycleSettingsService);
  route = inject(ActivatedRoute);
  private imageUrlService = inject(ImageUrlService);
  profileImage: string | null = null;
  selectedProfile: File | null = null;
  showCropper = false;
  zoom = 1;
  private imageBitmap: ImageBitmap | null = null;
  @ViewChild('cropCanvas') cropCanvas!: ElementRef<HTMLCanvasElement>;

  showPicker = false;

  // Arrays for picker options
  daysMenstrualCycle: number[] = Array.from({ length: 41 }, (_, i) => i + 20);
  daysPeriodUsual: number[] = Array.from({ length: 8 }, (_, i) => i + 3);

  // Final values bound to inputs
  menstrualCycleDay = 28; // default cycle length
  usualPeriodDays = 5; // default period length

  // Temporary values while picker is open
  tempCycleDay = this.menstrualCycleDay;
  tempUsualPeriodDay = this.usualPeriodDays;

  showPickerLastPeriod = false;
  startDate: any;

  // Getter to format the start date for display
  get formattedStartDate(): string {
    if (!this.startDate) return '';
    
    try {
      const date = new Date(this.startDate);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  }

  // Picker properties for the new ion-picker format
  tempYear: number = new Date().getFullYear();
  tempMonth: number = new Date().getMonth() + 1;
  tempDay: number = new Date().getDate();
  years: number[] = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - 12 + i);
  months: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
  pickerDays: number[] = [];

  // Date constraints for the picker (not used with ion-picker)
  message: string = '';
  name = '';
  @ViewChild(IonModal) modal!: IonModal;
  userInfoStore: any;

  statusOptions = [
    { label: 'I am planning to get pregnant', value: 'PLANNING_PREGNANCY' },
    { label: 'I am pregnant', value: 'PREGNANT' },
    { label: 'I have a child', value: 'HAS_CHILD' },
  ];

  constructor(private fb: FormBuilder) {
    addIcons({ pencil, star, location, refresh, checkmark, camera, person, heart, calendar, close });
  }

  form: FormGroup = this.fb.group({
    profileImage: [''],
    status: [null, Validators.required],
    menstrualCycleDay: [28],
    periodUsual: [5],
    lastPeriodStartDate: [null],
    name: [''],
    birthday: [''],
    email: [''],
  });
  // Method to check form control state
  checkFormControlState(): void {
    // Form state checking functionality
  }

  ngOnInit() {
    console.log('=== Component Initialization ===');
    this.userInfoStore = JSON.parse(localStorage.getItem('userInfo') || '{}');
    console.log('User info store:', this.userInfoStore);

    // Check initial form state
    this.checkFormControlState();

    this.route.queryParamMap.subscribe((params) => {
      const focus = params.get('focus');
      setTimeout(() => {
        if (focus === 'name') {
          const el = document.querySelector('ion-input[formControlName="name"] input') as HTMLInputElement | null;
          el?.focus();
        } else if (focus === 'email') {
          const el = document.querySelector('ion-input[formControlName="email"] input') as HTMLInputElement | null;
          el?.focus();
        } else if (focus === 'birthday') {
          const btn = document.querySelector('ion-datetime-button[datetime="birthdayPicker"]') as HTMLElement | null;
          btn?.click();
        }
      });
    });

    // Load existing user data from API and patch the form
    try {
      const id = this.userInfoStore?.user?.id;
      if (id) {
        this.userService.getUser(String(id)).subscribe((res: any) => {
          // Map server fields to form controls
          const patch: any = {
            name: res?.name ?? '',
            email: res?.email ?? '',
            birthday: res?.birthday ?? '',
            menstrualCycleDay: res?.menstrualCycleLength ?? 28,
            periodUsual: res?.periodDuration ?? 5,
            lastPeriodStartDate: res?.lastPeriodStartDate ?? null,
            profileImage: res?.profileImage ?? '',
            status: res?.status ?? null,
          };
          this.form.patchValue(patch);

          // Set profile image with proper URL
          this.profileImage = this.imageUrlService.getImageUrl(res?.profileImage);

          // Check form state after patch
          setTimeout(() => {
            this.checkFormControlState();
          }, 100);

          // reflect last period start in the local startDate for the readonly input
          this.startDate = patch.lastPeriodStartDate;
        });


      }
    } catch { }

    // Initialize picker days array

    // Initialize picker days array
    this.updatePickerDays();
  }




  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size should be less than 5MB');
        return;
      }

      this.selectedProfile = file;
      console.log('File validated, processing...');

      // Try modern createImageBitmap first, fallback to FileReader
      if (typeof createImageBitmap === 'function') {
        try {
          console.log('Using createImageBitmap...');
          createImageBitmap(file).then((bmp) => {
            console.log('ImageBitmap created:', bmp.width, 'x', bmp.height);
            this.imageBitmap = bmp;
            this.showCropper = true;

            // Wait for the modal to be fully rendered before rendering the crop
            setTimeout(() => {
              console.log('Modal should be open, rendering crop...');
              this.renderCrop();
              // Don't auto-confirm - let user crop manually
            }, 300);
          }).catch((error) => {
            console.error('Error creating image bitmap:', error);
            this.fallbackImageProcessing(file);
          });
        } catch (error) {
          console.error('Error in createImageBitmap:', error);
          this.fallbackImageProcessing(file);
        }
      } else {
        // Fallback for older browsers
        console.log('Using fallback image processing...');
        this.fallbackImageProcessing(file);
      }
    }
  }

  // Fallback method for browsers that don't support createImageBitmap
  private fallbackImageProcessing(file: File) {
    console.log('Using fallback image processing...');
    const reader = new FileReader();

    reader.onload = (e) => {
      console.log('File read successfully, creating image...');
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded:', img.width, 'x', img.height);
        // Create a canvas to convert to ImageBitmap-like object
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Convert canvas to ImageBitmap-like object
          this.imageBitmap = canvas as any;
          this.showCropper = true;

          setTimeout(() => {
            console.log('Rendering crop with fallback...');
            this.renderCrop();
            // Don't auto-confirm - let user crop manually
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
    if (!this.cropCanvas || !this.cropCanvas.nativeElement || !this.imageBitmap) {
      console.error('Cannot render crop: missing elements', {
        canvas: !!this.cropCanvas,
        canvasElement: !!this.cropCanvas?.nativeElement,
        imageBitmap: !!this.imageBitmap
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

    // Calculate scaling to fit image within canvas while maintaining aspect ratio
    const scaleX = size / iw;
    const scaleY = size / ih;
    const scale = Math.min(scaleX, scaleY) * this.zoom;

    // Calculate dimensions after scaling
    const dw = iw * scale;
    const dh = ih * scale;

    // Center the image on the canvas
    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;

    console.log('Rendering crop:', {
      iw, ih, scale, dw, dh, dx, dy, zoom: this.zoom,
      scaleX, scaleY, finalScale: scale
    });

    try {
      // Draw the image centered on the canvas
      ctx.drawImage(this.imageBitmap, dx, dy, dw, dh);
      console.log('Image rendered successfully');

      // Add a border to make the canvas visible
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

    // Reset file input so user can select the same image again if needed
    const fileInput = document.getElementById('fileeInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', 0.9));
  }

  compareWith(o1: any, o2: any): boolean {
    // Handle both cases:
    // 1. When comparing option objects (o1 and o2 are both option objects)
    // 2. When comparing option object with form value (o1 is option, o2 is string value)
    if (o1 && o2) {
      if (typeof o1 === 'object' && typeof o2 === 'object') {
        // Both are option objects
        return o1.value === o2.value;
      } else if (typeof o1 === 'object' && typeof o2 === 'string') {
        // o1 is option object, o2 is string value
        return o1.value === o2;
      } else if (typeof o1 === 'string' && typeof o2 === 'object') {
        // o1 is string value, o2 is option object
        return o1 === o2.value;
      } else {
        // Both are strings
        return o1 === o2;
      }
    }
    return false;
  }

  handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    // Status change handled
  }



  confirmPicker() {
    console.log('Confirming picker...');
    try {
      // Format the date for display and storage using picker values
      const formattedDate = `${this.tempYear}-${String(this.tempMonth).padStart(2, '0')}-${String(this.tempDay).padStart(2, '0')}`;
      console.log('Formatted date:', formattedDate);

      // Update the start date and form
      this.startDate = formattedDate;
      this.form.patchValue({ lastPeriodStartDate: this.startDate });

      // Close the date picker modal
      this.closeDatePicker();

      // Show success feedback
      this.showSuccessAlert('Last period start date updated successfully!');

    } catch (error) {
      console.error('Error in confirmPicker:', error);
      this.showErrorAlert('Error selecting date. Please try again.');
    }
  }



  // Old cancel method removed - now using cancelDatePicker()
  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    if (event.detail.role === 'confirm') {
      this.message = `Hello, ${event.detail.data}!`;
    }
  }

  onBirthdayChange(event: any) {
    const date = event.detail?.value;
    this.form.patchValue({ birthday: date });
  }

  onSubmit() {
    const formValues = this.form.value;
    const id = this.userInfoStore.user.id;
debugger;
    // Show loading state
    this.showLoadingAlert('Saving profile...');

    // also reflect in localStorage userInfo if present for profile display
    try {
      const store = JSON.parse(localStorage.getItem('userInfo') || '{}');
      store.user = {
        ...(store.user || {}),
        name: formValues.name,
        email: formValues.email,
        birthday: formValues.birthday,
      };
      localStorage.setItem('userInfo', JSON.stringify(store));
    } catch { }

    // Persist locally for the app chart
    this.cycleSettings.setCycleLength(formValues.menstrualCycleDay ?? 28);
    this.cycleSettings.setPeriodLength(formValues.periodUsual ?? 5);
    this.cycleSettings.setLastPeriodStart(formValues.lastPeriodStartDate ?? null);

    // Map form to server DTO field names
    const payload: any = {
      name: formValues.name,
      email: formValues.email,
      birthday: formValues.birthday,
      profileImage: formValues.profileImage,
      status: formValues.status,
      menstrualCycleLength: formValues.menstrualCycleDay,
      periodDuration: formValues.periodUsual,
      lastPeriodStartDate: formValues.lastPeriodStartDate,
    };

    this.userService.updateUserInfo(id, payload).subscribe({
      next: (res: any) => {
        this.showSuccessAlert('Profile updated successfully!');
      },
      error: (error: any) => {
        console.error('Error updating profile:', error);
        this.showErrorAlert('Failed to update profile. Please try again.');
      }
    });
  }

  async confirmCrop() {
    try {
      if (!this.cropCanvas?.nativeElement) {
        console.error('Crop canvas not available');
        return;
      }

      console.log('Starting crop confirmation...');
      const canvas = this.cropCanvas.nativeElement;

      // Log canvas state
      console.log('Canvas state:', {
        width: canvas.width,
        height: canvas.height,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight
      });

      const blob = await this.canvasToBlob(canvas);
      console.log('Blob created:', blob.size, 'bytes, type:', blob.type);

      const id = this.userInfoStore?.user?.id;
      if (!id) {
        console.error('No user ID available');
        alert('User not found. Please try again.');
        return;
      }

      console.log('Uploading image...');
      this.userService.uploadProfileImage(String(id), blob).subscribe({
        next: (res: any) => {
          console.log('Upload successful:', res);

          // Set preview and form control
          this.profileImage = this.imageUrlService.getImageUrl(res.url);
          this.form.patchValue({ profileImage: res.url });

          console.log('Profile image updated:', this.profileImage);

          // Update local storage for profile page
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
        }
      });
    } catch (error) {
      console.error('Error in confirmCrop:', error);
      alert('Error processing image. Please try again.');
      this.closeCropper();
    }
  }




  // Method to manually set status (for debugging)
  setStatus(statusValue: string | null): void {
    this.form.patchValue({ status: statusValue });
  }

  // Method to check cropper state (for debugging)
  checkCropperState(): void {
    console.log('Cropper state:', {
      showCropper: this.showCropper,
      imageBitmap: !!this.imageBitmap,
      canvas: !!this.cropCanvas,
      canvasElement: !!this.cropCanvas?.nativeElement
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
        visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0
      });
    }
  }

  // Method to force re-render the crop
  forceRenderCrop(): void {
    console.log('Forcing crop re-render...');
    if (this.showCropper && this.imageBitmap) {
      setTimeout(() => {
        this.renderCrop();
      }, 100);
    }
  }

  // Method to test image display
  testImageDisplay(): void {
    console.log('Testing image display...');
    console.log('Current profileImage:', this.profileImage);
    console.log('Form profileImage value:', this.form.get('profileImage')?.value);

    // Test with a sample image
    const testImage = 'https://ionicframework.com/docs/img/demos/avatar.svg';
    this.profileImage = testImage;
    this.form.patchValue({ profileImage: testImage });

    console.log('Test image set:', this.profileImage);
  }

  // Method to check if image is actually visible
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
        visible: imgElement.offsetWidth > 0 && imgElement.offsetHeight > 0
      });
    } else {
      console.log('Image element not found');
    }
  }

  // Method to get current status value
  getCurrentStatus(): string | null {
    return this.form.get('status')?.value;
  }


  // Method to check if a status option is selected
  isStatusSelected(statusValue: string): boolean {
    const currentStatus = this.form.get('status')?.value;
    // Handle null case - if currentStatus is null, no option is selected
    if (currentStatus === null) {
      return false;
    }
    return currentStatus === statusValue;
  }

  // Method to reset and reinitialize the form
  resetForm(): void {
    this.form.reset();
  }

  // Method to manually initialize the form with default values
  initializeFormWithDefaults(): void {
    console.log('Initializing form with defaults...');
    this.form.patchValue({
      status: null,
      menstrualCycleDay: 28,
      periodUsual: 5,
      name: '',
      email: '',
      birthday: '',
      profileImage: '',
      lastPeriodStartDate: null
    });
    console.log('Form after initialization:', this.form.value);
  }

  // Method to manually trigger form initialization
  triggerFormInit(): void {
    console.log('=== Manual Form Initialization ===');
    console.log('Current form state:', this.form.value);
    console.log('Status options:', this.statusOptions);

    // Try to set a specific status
    this.setStatus('PLANNING_PREGNANCY');

    // Check if the radio button should be selected
    setTimeout(() => {
      this.checkFormControlState();
    }, 100);
  }

  // Method to test radio button selection
  testRadioSelection(): void {
    this.statusOptions.forEach(option => {

    });
  }

  // Method to show loading alert
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

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 12px;
      max-width: 300px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;

    const spinner = document.createElement('div');
    spinner.innerHTML = '⏳';
    spinner.style.cssText = `
      font-size: 48px;
      margin-bottom: 16px;
      animation: spin 1s linear infinite;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    `;

    content.appendChild(spinner);
    content.appendChild(messageElement);
    loadingDialog.appendChild(content);
    document.body.appendChild(loadingDialog);

    // Store reference for removal
    (this as any).loadingDialog = loadingDialog;
  }

  // Method to hide loading alert
  hideLoadingAlert(): void {
    if ((this as any).loadingDialog) {
      (this as any).loadingDialog.remove();
      (this as any).loadingDialog = null;
    }
  }

  // Method to show success alert
  showSuccessAlert(message: string): void {
    // Hide loading first
    this.hideLoadingAlert();

    const successDialog = document.createElement('div');
    successDialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `✅ ${message}`;
    messageElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    successDialog.appendChild(messageElement);
    document.body.appendChild(successDialog);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (successDialog.parentNode) {
        successDialog.remove();
      }
    }, 3000);
  }

  // Method to show error alert
  showErrorAlert(message: string): void {
    // Hide loading first
    this.hideLoadingAlert();

    const errorDialog = document.createElement('div');
    errorDialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `❌ ${message}`;
    messageElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    errorDialog.appendChild(messageElement);
    document.body.appendChild(errorDialog);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDialog.parentNode) {
        errorDialog.remove();
      }
    }, 5000);
  }

  // Method to open the date picker modal for last period start
  openDatePicker() {
    console.log('Opening date picker...');
    console.log('Current showPickerLastPeriod:', this.showPickerLastPeriod);
    
    // Initialize picker values from startDate or current date
    if (this.startDate) {
      try {
        const date = this.startDate instanceof Date ? this.startDate : new Date(this.startDate);
        if (!isNaN(date.getTime())) {
          this.tempYear = date.getFullYear();
          this.tempMonth = date.getMonth() + 1;
          this.tempDay = date.getDate();
        } else {
          const now = new Date();
          this.tempYear = now.getFullYear();
          this.tempMonth = now.getMonth() + 1;
          this.tempDay = now.getDate();
        }
      } catch (error) {
        const now = new Date();
        this.tempYear = now.getFullYear();
        this.tempMonth = now.getMonth() + 1;
        this.tempDay = now.getDate();
      }
    } else {
      const now = new Date();
      this.tempYear = now.getFullYear();
      this.tempMonth = now.getMonth() + 1;
      this.tempDay = now.getDate();
    }

    // Update the days array for the selected month
    this.updatePickerDays();

    this.showPickerLastPeriod = true;
    console.log('Set showPickerLastPeriod to:', this.showPickerLastPeriod);
    console.log('Picker values:', { tempYear: this.tempYear, tempMonth: this.tempMonth, tempDay: this.tempDay });
  }

  // Method to close the date picker modal
  closeDatePicker() {
    console.log('Closing date picker...');
    this.showPickerLastPeriod = false;
  }

  // Method to cancel date picker selection
  cancelDatePicker() {
    console.log('Cancelling date picker...');
    this.showPickerLastPeriod = false;
  }

  // Method to handle picker column changes
  onChange(event: any, type: 'year' | 'month' | 'day') {
    const value = event.detail.value;

    switch (type) {
      case 'year':
        this.tempYear = value;
        break;
      case 'month':
        this.tempMonth = value;
        break;
      case 'day':
        this.tempDay = value;
        break;
    }

    // Update days array when year or month changes
    if (type === 'year' || type === 'month') {
      this.updatePickerDays();
    }
  }

  // Method to update the days array based on selected year and month
  private updatePickerDays() {
    const daysInMonth = new Date(this.tempYear, this.tempMonth, 0).getDate();
    this.pickerDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Adjust tempDay if it exceeds the new month's days
    if (this.tempDay > daysInMonth) {
      this.tempDay = daysInMonth;
    }
    
    console.log('Updated picker days:', {
      year: this.tempYear,
      month: this.tempMonth,
      daysInMonth,
      pickerDays: this.pickerDays.length,
      tempDay: this.tempDay
    });
  }
}
