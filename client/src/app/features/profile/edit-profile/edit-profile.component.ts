import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { addIcons } from 'ionicons';
import {
  pencil,
  star,
  location,
  refresh,
  checkmark,
  camera,
  heart,
  close,
  sparkles,
  people,
  heartCircle,
  heartDislike,
  removeOutline,
  addOutline,
  helpCircleOutline,
  moonOutline,
  flower,
  calendarNumberOutline,
  calendarOutline,
  chevronBackCircleOutline,
  arrowForwardCircleOutline,
} from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '@app/shared/services/user';
import { ActivatedRoute, Router } from '@angular/router';
import { UserInfoService } from '@app/shared/services/user-info.service';
import { ImageUrlService } from '@app/shared/services/image-url.service';
import {
  DashboardResponse,
  InitializeReproductiveStateDto,
  OnboardingService,
  ReproductiveStatus,
} from '@app/shared/services/onboarding.service';
import { AlertController, LoadingController, ModalController } from '@ionic/angular/standalone';
import { LanguageService } from '@app/shared/services/language.service';
import * as jalaali from 'jalaali-js';
import {
  formatJalaliFaFromIso,
  J_MONTHS,
  jalaliDaysInMonth,
  jalaliToIsoDate,
} from '@app/shared/utils/jalali-iranian-calendar.util';
import {
  formatHistoryDayDate,
  isPersianAppLanguage,
} from '@app/shared/utils/locale-date-format.util';
import {
  helpKeyForValidationError,
  maxDateOfBirthIso,
  minDateOfBirthIso,
  validateDateOfBirthIso,
} from '@app/shared/utils/reproductive-date-validation.util';
import { addCalendarDaysIso } from '@app/shared/utils/pregnancy-lmp.util';
import { PregnancySetupSheetComponent } from '@app/shared/ui/pregnancy-setup-sheet/pregnancy-setup-sheet.component';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HomeDataService } from '@app/features/home/services/home-data.service';
import { HomeJourneyBridgeService } from '@app/features/home/services/home-journey-bridge.service';
import { HomeReproductiveUiService } from '@app/features/home/services/home-reproductive-ui.service';
import { UserSessionService } from '@app/shared/services/user-session.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { ProfileCompletionService } from '@app/shared/services/profile-completion.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class EditProfileComponent implements OnInit {
  private readonly translation = inject(TranslationService);

  private loc(key: string): string {
    return this.translation.translate(key);
  }

  userService = inject(User);
  userInfoService = inject(UserInfoService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private imageUrlService = inject(ImageUrlService);
  profileImage: string | null = null;
  /** Email under avatar (from API; personal-info form removed). */
  displayEmail = '';
  /** Fields still sent on save so the API is not cleared by empty form values. */
  private profileContactSnapshot = {
    fullName: '',
    email: '',
    dateOfBirth: '',
  };
  selectedProfile: File | null = null;
  showCropper = false;
  /** Object URL for the image being cropped */
  cropImageObjectUrl: string | null = null;
  /** Zoom multiplier on top of “cover” scale (1 = fill circle). */
  cropZoom = 1;
  cropPanX = 0;
  cropPanY = 0;
  cropViewSizePx = 300;
  private cropPointerDownActive = false;
  private cropLastClientX = 0;
  private cropLastClientY = 0;
  private cropPinchStartDist = 0;
  private cropPinchStartZoom = 1;
  userId = 0;
  private homeService = inject(HomeDataService);
  private userSession = inject(UserSessionService);
  private onboardingService = inject(OnboardingService);
  private homeReproUi = inject(HomeReproductiveUiService);
  private homeJourneyBridge = inject(HomeJourneyBridgeService);
  private modalController = inject(ModalController);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private profileCompletionService = inject(ProfileCompletionService);
  private languageService = inject(LanguageService);

  /** True while PUT /user/:id/edit is in flight from the personal details form. */
  isSavingPersonal = false;

  isDobPickerOpen = false;
  dobPickerIso = '';
  dobPickerError = '';
  dobPickerHelp = '';
  readonly dobMinIso = minDateOfBirthIso();
  readonly dobMaxIso = maxDateOfBirthIso();
  readonly jalaliDobMonths = J_MONTHS.map((label, idx) => ({
    label,
    value: idx + 1,
  }));
  readonly jalaliDobYears: number[] = (() => {
    const [minGy, minGm, minGd] = minDateOfBirthIso().split('-').map((n) => parseInt(n, 10));
    const [maxGy, maxGm, maxGd] = maxDateOfBirthIso().split('-').map((n) => parseInt(n, 10));
    const minJ = jalaali.toJalaali(minGy, minGm, minGd);
    const maxJ = jalaali.toJalaali(maxGy, maxGm, maxGd);
    return Array.from({ length: maxJ.jy - minJ.jy + 1 }, (_, i) => minJ.jy + i);
  })();
  jalaliDobYear = this.jalaliDobYears[Math.floor(this.jalaliDobYears.length / 2)] ?? 1370;
  jalaliDobMonth = 1;
  jalaliDobDay = 1;

  @ViewChild('cropPreviewCanvas')
  cropPreviewCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cropSourceImage')
  cropSourceImage!: ElementRef<HTMLImageElement>;
  @ViewChild('cropStage') cropStage!: ElementRef<HTMLElement>;

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
      icon: 'flower',
      description: 'Actively trying to conceive',
      color: '#8b5cf6'
    },
    {
      label: 'Pregnant',
      value: 'PREGNANT',
      icon: 'heart-circle',
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

  // Reproductive Status Options (icons + short copy; user confirms with Continue)
  reproductiveStatusOptions: {
    label: string;
    value: string;
    subtitle: string;
    icon: string;
    color: string;
  }[] = [
    {
      label: "I'm pregnant",
      value: 'PREGNANT',
      subtitle: 'Track weeks, symptoms, and appointments in one place.',
      icon: 'heart-circle',
      color: '#ec4899',
    },
    {
      label: "I'm planning to get pregnant",
      value: 'PLANNING_PREGNANCY',
      subtitle: 'Log cycles and get planning tips when you are ready.',
      icon: 'flower',
      color: '#8b5cf6',
    },
    {
      label: "I'm not pregnant",
      value: 'NOT_PREGNANT',
      subtitle: 'Period tracking and general wellness without pregnancy mode.',
      icon: 'moon-outline',
      color: '#0ea5e9',
    },
  ];

  isEditingReproductiveStatus = false;
  currentReproductiveStatus: string | null = null;
  private pregnancyContinueConfirmed = false;

  constructor(private fb: FormBuilder) {
    addIcons({
      pencil,
      star,
      location,
      refresh,
      checkmark,
      camera,
      heart,
      close,
      sparkles,
      people,
      heartCircle,
      heartDislike,
      removeOutline,
      addOutline,
      helpCircleOutline,
      moonOutline,
      flower,
      calendarNumberOutline,
      calendarOutline,
      chevronBackCircleOutline,
      arrowForwardCircleOutline,
    });
  }

  form: FormGroup = this.fb.group({
    profileImage: [''],
    status: [null],
    fullName: ['', Validators.maxLength(120)],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    dateOfBirth: [''],
  });

  private loadUserDataFromAPI() {
    try {
      const id = this.userSession.getCurrentUserId();
      if (id > 0) {
        this.fetchUserDataAndOnboardingData(id);
      } else {
        console.error('No user info available');
      }
    } catch (error) {
    }
  }

  private fetchUserDataAndOnboardingData(userId: number) {
    const userData$ = this.userService.getUser(String(userId));
    const onboardingData$ = this.onboardingService.getDashboard();

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
        const onboarding = data.onboardingData as any;
        const u = this.extractUserPayload(data.userData);
        const dobRaw = u['dateOfBirth'] ?? u['birthday'];
        const dateOfBirthStr = this.toDateOnly(dobRaw);
        const mergedData = {
          fullName: String(u['fullName'] ?? u['name'] ?? '').trim(),
          email: String(u['email'] ?? '').trim(),
          dateOfBirth: dateOfBirthStr,
          profileImage: String(
            u['profileImage'] ?? u['profile_img'] ?? '',
          ).trim(),
          status: this.normalizeReproductiveStatusForForm(
            onboarding?.state,
          ),
        };

        this.patchFormWithUserData(mergedData);
        const repro = this.normalizeReproductiveStatusForForm(
          onboarding?.state,
        );
        this.currentReproductiveStatus = repro;
        this.applyPregnancyIntroQueryAfterLoad();
        this.scheduleFocusFromQuery();
      },
      error: (error) => {
        console.error('Failed to load user data:', error);
      },
    });
  }

  /** After intro screen, user returns with ?pregnancyIntro=1 to select Track pregnancy. */
  private applyPregnancyIntroQueryAfterLoad(): void {
    if (this.route.snapshot.queryParamMap.get('pregnancyIntro') !== '1') {
      return;
    }
    void this.setStatus('PREGNANT');
    void this.router.navigate(['/edit-profile'], { replaceUrl: true });
    this.cdr.markForCheck();
  }

  /** Scroll/focus field when opening from profile (?focus=name|email|dateOfBirth). */
  private scheduleFocusFromQuery(): void {
    const raw = (
      this.route.snapshot.queryParamMap.get('focus') ?? ''
    )
      .trim()
      .toLowerCase();
    const map: Record<string, 'fullName' | 'email' | 'dateOfBirth'> = {
      name: 'fullName',
      fullname: 'fullName',
      email: 'email',
      dateofbirth: 'dateOfBirth',
      birthday: 'dateOfBirth',
      dob: 'dateOfBirth',
    };
    const field = map[raw];
    if (!field) {
      return;
    }
    setTimeout(() => {
      const el = document.getElementById(`edit-focus-${field}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (field === 'dateOfBirth') {
        this.openBirthdayDatePicker();
        return;
      }
      const ionInput = el?.querySelector('ion-input');
      void (ionInput as { setFocus?: () => Promise<void> } | undefined)?.setFocus?.();
    }, 500);
  }

  /** Saves name, email, and birthday without reproductive-status flows. */
  savePersonalDetails(): void {
    this.form.markAllAsTouched();
    if (this.form.get('email')?.invalid) {
      this.showErrorAlert(this.loc('editProfile.invalidEmail'));
      return;
    }

    const currentUserInfo = this.userInfoService.getCurrentUserInfo();
    const id =
      currentUserInfo?.data?.id ??
      currentUserInfo?.user?.id ??
      currentUserInfo?.userId ??
      this.userSession.getCurrentUserId();
    if (!id) {
      this.showErrorAlert(this.loc('editProfile.saveFailed'));
      return;
    }

    const payload = this.buildProfileUpdatePayload(this.form.value);
    if (Object.keys(payload).length === 0) {
      this.showErrorAlert(this.loc('editProfile.nothingToSave'));
      return;
    }

    this.isSavingPersonal = true;
    this.cdr.markForCheck();

    this.userService.updateUserInfo(String(id), payload as any).subscribe({
      next: () => {
        this.profileContactSnapshot = {
          fullName: String(this.form.get('fullName')?.value ?? '').trim(),
          email: String(this.form.get('email')?.value ?? '').trim(),
          dateOfBirth: this.toDateOnly(this.form.get('dateOfBirth')?.value ?? ''),
        };
        this.displayEmail = this.profileContactSnapshot.email;
        try {
          this.userSession.mergeIntoStoredUser({
            fullName: this.profileContactSnapshot.fullName,
            email: this.profileContactSnapshot.email,
            dateOfBirth: this.profileContactSnapshot.dateOfBirth,
          });
        } catch {
          /* ignore */
        }
        this.profileCompletionService.refreshFromAPI().subscribe({
          error: () => {
            /* non-blocking */
          },
        });
        this.isSavingPersonal = false;
        this.showSuccessAlert(this.loc('editProfile.saved'));
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        console.error('savePersonalDetails', err);
        this.isSavingPersonal = false;
        this.showErrorAlert(this.loc('editProfile.saveFailed'));
        this.cdr.markForCheck();
      },
    });
  }

  openTrackPregnancyIntro(): void {
    void this.router.navigate(['/track-pregnancy-intro']);
  }

  private patchFormWithUserData(userData: any) {
    this.profileContactSnapshot = {
      fullName: userData?.fullName ?? '',
      email: userData?.email ?? '',
      dateOfBirth: this.toDateOnly(userData?.dateOfBirth ?? ''),
    };
    this.displayEmail = this.profileContactSnapshot.email;

    const patch: any = {
      profileImage: userData?.profileImage ?? '',
      status: userData?.status ?? null,
      fullName: userData?.fullName ?? '',
      email: userData?.email ?? '',
      dateOfBirth: this.toDateOnly(userData?.dateOfBirth ?? ''),
    };

    this.form.patchValue(patch);
    // Avoid NG0100: HTTP/subscribe can set profileImage after dev-mode's extra CD pass.
    const nextSrc = this.imageUrlService.getImageUrl(userData?.profileImage);
    const dobForInput = this.toDateOnly(userData?.dateOfBirth ?? '');
    queueMicrotask(() => {
      this.profileImage = nextSrc;
      this.form.get('dateOfBirth')?.setValue(dobForInput, { emitEvent: true });
      this.cdr.detectChanges();
    });

    setTimeout(() => {
      this.checkFormControlState();
    }, 100);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size should be less than 5MB');
      input.value = '';
      return;
    }

    this.selectedProfile = file;
    this.revokeCropObjectUrl();
    this.cropImageObjectUrl = URL.createObjectURL(file);
    this.cropZoom = 1;
    this.cropPanX = 0;
    this.cropPanY = 0;
    this.showCropper = true;
    this.cdr.detectChanges();
  }

  onCropModalPresented(): void {
    // Modal layout settles after two frames (Ionic overlay + flex).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.refreshCropStageSize());
    });
  }

  @HostListener('window:resize')
  onCropWindowResize(): void {
    if (!this.showCropper) return;
    cancelAnimationFrame(this.cropResizeRaf);
    this.cropResizeRaf = requestAnimationFrame(() => this.refreshCropStageSize());
  }

  private cropResizeRaf = 0;

  private refreshCropStageSize(): void {
    const el = this.cropStage?.nativeElement;
    const w = el?.clientWidth ?? 0;
    if (w > 0) {
      const next = Math.round(w);
      if (next !== this.cropViewSizePx) {
        this.cropViewSizePx = next;
      }
    }
    this.drawCropPreview();
  }

  onCropImageLoad(): void {
    this.cropZoom = 1;
    this.cropPanX = 0;
    this.cropPanY = 0;
    queueMicrotask(() => this.refreshCropStageSize());
  }

  onCropImageError(): void {
    alert('Could not load this image. Try another photo.');
    this.cancelCrop();
  }

  onCropZoomInput(ev: Event): void {
    const v = (ev as CustomEvent<{ value: unknown }>).detail?.value;
    const n = typeof v === 'number' ? v : null;
    if (n != null && !Number.isNaN(n)) {
      this.cropZoom = Math.min(4, Math.max(1, n));
      this.drawCropPreview();
    }
  }

  onCropPointerDown(ev: PointerEvent): void {
    if (ev.pointerType === 'touch') return;
    ev.preventDefault();
    this.cropPointerDownActive = true;
    this.cropLastClientX = ev.clientX;
    this.cropLastClientY = ev.clientY;
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
  }

  onCropPointerMove(ev: PointerEvent): void {
    if (!this.cropPointerDownActive || ev.pointerType === 'touch') return;
    ev.preventDefault();
    this.applyCropPanDelta(ev.clientX, ev.clientY);
    this.cropLastClientX = ev.clientX;
    this.cropLastClientY = ev.clientY;
  }

  onCropPointerUp(ev: PointerEvent): void {
    if (ev.pointerType === 'touch') return;
    this.cropPointerDownActive = false;
    try {
      (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
  }

  onCropTouchStart(ev: TouchEvent): void {
    if (ev.touches.length === 1) {
      const t = ev.touches[0];
      this.cropLastClientX = t.clientX;
      this.cropLastClientY = t.clientY;
    } else if (ev.touches.length === 2) {
      this.cropPinchStartDist = this.touchDistance(ev.touches);
      this.cropPinchStartZoom = this.cropZoom;
    }
  }

  onCropTouchMove(ev: TouchEvent): void {
    if (ev.touches.length === 2) {
      ev.preventDefault();
      const d = this.touchDistance(ev.touches);
      if (this.cropPinchStartDist > 0 && d > 0) {
        const next = (this.cropPinchStartZoom * d) / this.cropPinchStartDist;
        this.cropZoom = Math.min(4, Math.max(1, next));
        this.drawCropPreview();
      }
    } else if (ev.touches.length === 1) {
      ev.preventDefault();
      const t = ev.touches[0];
      this.applyCropPanDelta(t.clientX, t.clientY);
      this.cropLastClientX = t.clientX;
      this.cropLastClientY = t.clientY;
    }
  }

  onCropTouchEnd(ev: TouchEvent): void {
    if (ev.touches.length < 2) {
      this.cropPinchStartDist = 0;
    }
    if (ev.touches.length === 1) {
      const t = ev.touches[0];
      this.cropLastClientX = t.clientX;
      this.cropLastClientY = t.clientY;
    }
  }

  private touchDistance(touches: TouchList): number {
    const a = touches[0];
    const b = touches[1];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }

  private applyCropPanDelta(clientX: number, clientY: number): void {
    const canvas = this.cropPreviewCanvas?.nativeElement;
    if (!canvas) return;
    const dx = clientX - this.cropLastClientX;
    const dy = clientY - this.cropLastClientY;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const scale = this.cropViewSizePx / rect.width;
    this.cropPanX += dx * scale;
    this.cropPanY += dy * scale;
    this.drawCropPreview();
  }

  private drawTransformedImage(
    ctx: CanvasRenderingContext2D,
    viewSize: number,
    img: HTMLImageElement,
  ): void {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return;
    const baseCover = Math.max(viewSize / iw, viewSize / ih);
    const s = baseCover * this.cropZoom;
    const drawW = iw * s;
    const drawH = ih * s;
    const cx = viewSize / 2 + this.cropPanX;
    const cy = viewSize / 2 + this.cropPanY;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
  }

  drawCropPreview(): void {
    const canvas = this.cropPreviewCanvas?.nativeElement;
    const img = this.cropSourceImage?.nativeElement;
    if (!canvas || !img?.naturalWidth) return;

    const size = this.cropViewSizePx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(size * dpr));
    canvas.height = Math.max(1, Math.round(size * dpr));
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    const inset = 1;
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - inset, 0, Math.PI * 2);
    ctx.clip();
    this.drawTransformedImage(ctx, size, img);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - inset, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private async buildCroppedJpegBlob(): Promise<Blob> {
    const img = this.cropSourceImage?.nativeElement;
    if (!img?.naturalWidth) {
      throw new Error('Image not ready');
    }
    const out = 1024;
    const v = this.cropViewSizePx;
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');
    const ratio = out / v;
    const inset = 1;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.beginPath();
    ctx.arc(v / 2, v / 2, v / 2 - inset, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, v, v);
    this.drawTransformedImage(ctx, v, img);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Export failed'))),
        'image/jpeg',
        0.92,
      );
    });
  }

  cancelCrop(): void {
    this.showCropper = false;
    this.revokeCropObjectUrl();
    const input = document.getElementById('fileeInput') as HTMLInputElement | null;
    if (input) input.value = '';
    this.selectedProfile = null;
  }

  confirmCrop(): void {
    const currentUserInfo = this.userInfoService.getCurrentUserInfo();
    const id =
      currentUserInfo?.data?.id ??
      currentUserInfo?.userId ??
      this.userSession.getCurrentUserId();
    if (!id) {
      alert('User not found. Please sign in again.');
      return;
    }

    void (async () => {
      try {
        const blob = await this.buildCroppedJpegBlob();
        const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        this.showCropper = false;
        this.revokeCropObjectUrl();
        const input = document.getElementById('fileeInput') as HTMLInputElement | null;
        if (input) input.value = '';

        // Preview only — never put blob: URLs in the form (Save would persist them to DB).
        this.profileImage = previewUrl;
        this.cdr.detectChanges();

        this.userService.uploadProfileImage(String(id), file).subscribe({
          next: (res: any) => {
            URL.revokeObjectURL(previewUrl);
            this.profileImage = this.imageUrlService.getImageUrl(res.url);
            this.form.patchValue({ profileImage: res.url });
            try {
              this.userSession.mergeIntoStoredUser({
                profileImage: res.url,
              });
            } catch (e) {
              console.error('Error updating local storage:', e);
            }
            this.cdr.detectChanges();
          },
          error: (err: unknown) => {
            console.error('Error uploading image:', err);
            URL.revokeObjectURL(previewUrl);
            alert('Failed to upload image. Please try again.');
          },
        });
      } catch (e) {
        console.error(e);
        alert('Could not prepare the image. Please try again.');
      }
    })();
  }

  private revokeCropObjectUrl(): void {
    if (this.cropImageObjectUrl) {
      URL.revokeObjectURL(this.cropImageObjectUrl);
      this.cropImageObjectUrl = null;
    }
  }

  /**
   * Partial PUT body: omit empty optional fields so Nest validation (@IsEmail, @IsDate) does not fail
   * and forkJoin does not block PATCH /me/state.
   */
  private buildProfileUpdatePayload(formValues: {
    profileImage?: string | null;
    fullName?: unknown;
    email?: unknown;
    dateOfBirth?: unknown;
  }): Record<string, string> {
    const payload: Record<string, string> = {};
    const fullName = String(formValues.fullName ?? '').trim();
    const email = String(formValues.email ?? '').trim();
    const dob = this.toDateOnly(formValues.dateOfBirth ?? '').trim();
    if (fullName) payload['fullName'] = fullName;
    if (email) payload['email'] = email;
    if (dob) payload['dateOfBirth'] = dob;
    const persistedImage = this.sanitizeProfileImageForApi(formValues.profileImage);
    if (persistedImage !== undefined) {
      payload['profileImage'] = persistedImage;
    }
    return payload;
  }

  /** Only http(s) or server paths belong in the API/DB — never blob: or data: URLs. */
  private sanitizeProfileImageForApi(
    raw: string | null | undefined,
  ): string | undefined {
    if (raw === undefined || raw === null) return undefined;
    const v = String(raw).trim();
    if (!v) return undefined;
    if (v.startsWith('blob:') || v.startsWith('data:')) return undefined;
    if (
      v.startsWith('http://') ||
      v.startsWith('https://') ||
      v.startsWith('/uploads/')
    ) {
      return v;
    }
    // Relative filename-only paths from older APIs
    if (/^[\w./-]+\.(jpe?g|png|gif|webp)$/i.test(v)) return v;
    return undefined;
  }

  private toDateOnly(value: unknown): string {
    const s = String(value ?? '').trim();
    if (!s || s === 'null' || s === 'undefined') return '';
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m?.[1]) return m[1];
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  async onSubmit(source: 'save' | 'continue' = 'save') {
    const formValues = this.form.value;
    const currentUserInfo = this.userInfoService.getCurrentUserInfo();
    const id =
      currentUserInfo?.data?.id ??
      currentUserInfo?.user?.id ??
      currentUserInfo?.userId ??
      this.userSession.getCurrentUserId();
    if (!id) {
      console.error('No user ID available');
      alert('User not found. Please try again.');
      return;
    }

    const selectedStatus =
      this.currentReproductiveStatus ?? this.form.get('status')?.value ?? null;
    const reproductiveState = this.mapUiReproductiveToApiPregnancyStatus(selectedStatus);
    if (
      source === 'save' &&
      reproductiveState === 'pregnant' &&
      !this.pregnancyContinueConfirmed
    ) {
      this.showErrorAlert(
        'Please tap Continue and confirm the first day of last period first.',
      );
      return;
    }
    let reproductivePayload: InitializeReproductiveStateDto | null = null;
    if (reproductiveState === 'pregnant') {
      const modal = await this.modalController.create({
        component: PregnancySetupSheetComponent,
      });
      await modal.present();
      const { data, role } = await modal.onWillDismiss<InitializeReproductiveStateDto>();
      if (role !== 'confirm' || !data) {
        return;
      }
      reproductivePayload = data;
      this.pregnancyContinueConfirmed = true;
    } else if (reproductiveState) {
      reproductivePayload = { state: reproductiveState };
      this.pregnancyContinueConfirmed = true;
    }
    const reproductiveReq = reproductivePayload
      ? this.onboardingService.updateReproductiveState(reproductivePayload)
      : of(null);
    const shouldGoHomeAfterSave =
      reproductiveState === 'pregnant' && reproductivePayload !== null;

    try {
      this.userSession.mergeIntoStoredUser({
        fullName: String(this.form.get('fullName')?.value ?? '').trim(),
        email: String(this.form.get('email')?.value ?? '').trim(),
        dateOfBirth: this.toDateOnly(this.form.get('dateOfBirth')?.value ?? ''),
      });
    } catch {
      /* ignore */
    }

    const payload = this.buildProfileUpdatePayload({
      ...formValues,
      fullName: this.form.get('fullName')?.value,
      email: this.form.get('email')?.value,
      dateOfBirth: this.form.get('dateOfBirth')?.value,
    });
    const profileReq =
      Object.keys(payload).length > 0
        ? this.userService.updateUserInfo(String(id), payload as any)
        : of(null);

    const loading = await this.loadingController.create({
      message: 'Saving profile...',
      spinner: 'crescent',
    });
    await loading.present();

    forkJoin({
      profile: profileReq,
      reproductive: reproductiveReq,
    }).pipe(finalize(() => loading.dismiss())).subscribe({
      next: (result: { profile: unknown; reproductive: DashboardResponse | null }) => {
        const dashboard = result.reproductive;
        if (dashboard && typeof dashboard === 'object' && 'state' in dashboard) {
          this.pushHomeJourneyFromDashboard(dashboard as DashboardResponse);
        }
        this.updateUserInfoService(formValues);
        this.showSuccessAlert(this.loc('editProfile.toast.profileUpdated'));
        if (shouldGoHomeAfterSave) {
          this.router.navigate(['/tabs/home'], { replaceUrl: true });
          return;
        }
        if (selectedStatus === 'PLANNING_PREGNANCY' && reproductivePayload) {
          this.router.navigate(['/pregnancy-planning']);
        }
      },
      error: (error: any) => {
        console.error('Error updating profile:', error);
        this.showErrorAlert(this.loc('editProfile.toast.updateFailed'));
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

      this.userInfoService.userInfo.set(updatedUserInfo);
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
    } else {
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

      this.userInfoService.userInfo.set(newUserInfo);
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
    }
  }

 

  /** Select only — user confirms with Continue (no immediate navigation). */
  async setStatus(statusValue: string | null): Promise<void> {
    if (
      statusValue === 'NOT_PREGNANT' &&
      (this.currentReproductiveStatus ?? this.form.get('status')?.value) !== 'NOT_PREGNANT'
    ) {
      const alert = await this.alertController.create({
        cssClass: 'liquid-glass-dialog',
        header: this.loc('editProfile.alert.switchCycleHeader'),
        message: this.loc('editProfile.alert.switchCycleMessage'),
        buttons: [
          {
            text: this.loc('editProfile.alert.notNow'),
            role: 'cancel',
          },
          {
            text: this.loc('editProfile.alert.yesSwitch'),
            role: 'confirm',
          },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      if (role !== 'confirm') {
        return;
      }
    }

    this.form.patchValue({ status: statusValue });
    this.currentReproductiveStatus = statusValue;
    this.pregnancyContinueConfirmed = statusValue !== 'PREGNANT';
    this.cdr.markForCheck();
  }

  isSaveDisabled(): boolean {
    const selected =
      this.currentReproductiveStatus ?? (this.form.get('status')?.value as string | null);
    return selected === 'PREGNANT' && !this.pregnancyContinueConfirmed;
  }

  getSelectedReproductiveOption():
    | (typeof this.reproductiveStatusOptions)[number]
    | undefined {
    const v = this.form.get('status')?.value as string | null;
    if (!v) {
      return undefined;
    }
    return this.reproductiveStatusOptions.find((o) => o.value === v);
  }

  checkFormControlState(): void {
  }

  checkCropperState(): void {
    // Debug helper — intentionally no-op in production
  }

 

  testImageDisplay(): void {
    const testImage = 'https://ionicframework.com/docs/img/demos/avatar.svg';
    this.profileImage = testImage;
    this.form.patchValue({ profileImage: testImage });
  }

  checkImageVisibility(): void {
    // Debug helper — intentionally no-op in production
  }

  getCurrentStatus(): string | null {
    return (
      (this.currentReproductiveStatus ??
        (this.form.get('status')?.value as string | null)) ||
      null
    );
  }

  isStatusSelected(statusValue: string): boolean {
    const currentStatus =
      this.currentReproductiveStatus ??
      (this.form.get('status')?.value as string | null);
    if (currentStatus === null || currentStatus === undefined) {
      return false;
    }
    return currentStatus === statusValue;
  }


  resetForm(): void {
    this.form.reset();
    this.profileContactSnapshot = { fullName: '', email: '', dateOfBirth: '' };
    this.displayEmail = '';
  }

  initializeFormWithDefaults(): void {
    this.form.patchValue({
      status: null,
      profileImage: '',
      fullName: '',
      email: '',
      dateOfBirth: '',
    });
    this.profileContactSnapshot = { fullName: '', email: '', dateOfBirth: '' };
    this.displayEmail = '';
  }

  triggerFormInit(): void {
    this.setStatus('PLANNING_PREGNANCY');
    setTimeout(() => {
      this.checkFormControlState();
    }, 100);
  }

  ngOnInit(): void {
    this.userId = this.homeService.getCurrentUserId();
    this.prefillContactFromSession();
    this.loadUserDataFromAPI();
  }

  /** True when birthday is set (YYYY-MM-DD) — used to highlight “complete profile” when missing. */
  get hasDateOfBirth(): boolean {
    return !!this.toDateOnly(this.form.get('dateOfBirth')?.value ?? '').trim();
  }

  get displayBirthdayDate(): string {
    const iso = this.toDateOnly(this.form.get('dateOfBirth')?.value ?? '');
    if (!iso) {
      return this.loc('reproductiveStatus.chooseDate');
    }
    const lang = this.languageService.getCurrentLanguage();
    if (isPersianAppLanguage(lang)) {
      return formatJalaliFaFromIso(iso, 'DD MMMM YYYY');
    }
    const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
    return formatHistoryDayDate(new Date(y, m - 1, d), lang);
  }

  get dobPickerRangeHint(): string {
    return this.translation.translateParams('editProfile.dobPickerRangeHint', {
      minDate: this.formatBirthdayDisplayDate(this.dobMinIso),
      maxDate: this.formatBirthdayDisplayDate(this.dobMaxIso),
    });
  }

  get isPersianLanguage(): boolean {
    return isPersianAppLanguage(this.languageService.getCurrentLanguage());
  }

  get jalaliDobDayOptions(): number[] {
    const len = jalaliDaysInMonth(this.jalaliDobYear, this.jalaliDobMonth);
    return Array.from({ length: len }, (_, i) => i + 1);
  }

  openBirthdayDatePicker(): void {
    this.clearDobPickerFeedback();
    const current = this.toDateOnly(this.form.get('dateOfBirth')?.value ?? '');
    const seedIso = current || this.defaultBirthdaySeedIso();
    if (this.isPersianLanguage) {
      this.syncJalaliDobFromIso(seedIso);
    } else {
      this.dobPickerIso = seedIso;
    }
    this.isDobPickerOpen = true;
    this.validateActiveDobPicker();
    this.cdr.markForCheck();
  }

  onDobPickerDismiss(): void {
    this.isDobPickerOpen = false;
    this.clearDobPickerFeedback();
  }

  onDobPickerChange(event: CustomEvent): void {
    const value = (event.detail as { value?: string }).value;
    if (!value) return;
    this.dobPickerIso = value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
    this.validateActiveDobPicker();
    this.cdr.markForCheck();
  }

  onJalaliDobColumnChange(event: CustomEvent, column: 'day' | 'month' | 'year'): void {
    const value = Number((event.detail as { value?: number | string }).value);
    if (!Number.isFinite(value)) return;
    if (column === 'year') {
      this.jalaliDobYear = value;
    } else if (column === 'month') {
      this.jalaliDobMonth = value;
    } else {
      this.jalaliDobDay = value;
    }
    const maxDay = jalaliDaysInMonth(this.jalaliDobYear, this.jalaliDobMonth);
    if (this.jalaliDobDay > maxDay) {
      this.jalaliDobDay = maxDay;
    }
    this.validateActiveDobPicker();
    this.cdr.markForCheck();
  }

  closeDobPicker(role: 'cancel' | 'confirm'): void {
    if (role === 'confirm') {
      const check = this.isPersianLanguage
        ? validateDateOfBirthIso(
            jalaliToIsoDate(this.jalaliDobYear, this.jalaliDobMonth, this.jalaliDobDay),
          )
        : validateDateOfBirthIso(this.dobPickerIso);
      if (!check.valid) {
        this.setDobPickerFeedback(check.errorKey);
        return;
      }
      this.form.get('dateOfBirth')?.setValue(check.iso, { emitEvent: true });
      this.clearDobPickerFeedback();
    }
    this.isDobPickerOpen = false;
    this.cdr.markForCheck();
  }

  dobFieldError(): string {
    const iso = this.toDateOnly(this.form.get('dateOfBirth')?.value ?? '');
    if (!iso) return '';
    const check = validateDateOfBirthIso(iso);
    return check.valid ? '' : this.loc(check.errorKey);
  }

  dobFieldHelp(): string {
    const iso = this.toDateOnly(this.form.get('dateOfBirth')?.value ?? '');
    if (!iso) return '';
    const check = validateDateOfBirthIso(iso);
    if (check.valid) return '';
    const helpKey = helpKeyForValidationError(check.errorKey);
    return helpKey ? this.loc(helpKey) : '';
  }

  private defaultBirthdaySeedIso(): string {
    return addCalendarDaysIso(this.dobMaxIso, -365 * 25);
  }

  private formatBirthdayDisplayDate(iso: string): string {
    const lang = this.languageService.getCurrentLanguage();
    if (isPersianAppLanguage(lang)) {
      return formatJalaliFaFromIso(iso, 'DD MMMM YYYY');
    }
    const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
    return formatHistoryDayDate(new Date(y, m - 1, d), lang);
  }

  private setDobPickerFeedback(errorKey: string | null): void {
    if (!errorKey) {
      this.dobPickerError = '';
      this.dobPickerHelp = '';
      return;
    }
    this.dobPickerError = this.loc(errorKey);
    const helpKey = helpKeyForValidationError(errorKey);
    this.dobPickerHelp = helpKey ? this.loc(helpKey) : '';
  }

  private clearDobPickerFeedback(): void {
    this.dobPickerError = '';
    this.dobPickerHelp = '';
  }

  private syncJalaliDobFromIso(iso: string): void {
    const [gy, gm, gd] = iso.split('-').map((n) => parseInt(n, 10));
    const j = jalaali.toJalaali(gy, gm, gd);
    this.jalaliDobYear = this.jalaliDobYears.includes(j.jy)
      ? j.jy
      : (this.jalaliDobYears[this.jalaliDobYears.length - 1] ?? j.jy);
    this.jalaliDobMonth = j.jm;
    this.jalaliDobDay = j.jd;
    const maxDay = jalaliDaysInMonth(this.jalaliDobYear, this.jalaliDobMonth);
    if (this.jalaliDobDay > maxDay) {
      this.jalaliDobDay = maxDay;
    }
  }

  private validateActiveDobPicker(): void {
    const check = this.isPersianLanguage
      ? validateDateOfBirthIso(
          jalaliToIsoDate(this.jalaliDobYear, this.jalaliDobMonth, this.jalaliDobDay),
        )
      : validateDateOfBirthIso(this.dobPickerIso);
    this.setDobPickerFeedback(check.valid ? null : check.errorKey);
  }

  /** Normalizes GET /user/:id API wrapper (`data` vs flat) like ProfileCompletionService. */
  private extractUserPayload(res: unknown): Record<string, unknown> {
    if (!res || typeof res !== 'object') return {};
    const o = res as Record<string, unknown>;
    if (o['data'] != null && typeof o['data'] === 'object' && !Array.isArray(o['data'])) {
      return o['data'] as Record<string, unknown>;
    }
    if (o['id'] != null || o['email'] != null || o['fullName'] != null) {
      return o;
    }
    return {};
  }

  /** Show name/email/DOB from local session until GET /user returns. */
  private prefillContactFromSession(): void {
    try {
      const store = this.userSession.getUserInfoStoreOrEmpty();
      const u = (store?.user ?? {}) as Record<string, unknown>;
      const patch: Record<string, string> = {};
      const name = u['fullName'] ?? u['name'];
      if (name != null && String(name).trim()) {
        patch['fullName'] = String(name).trim();
      }
      if (u['email'] != null && String(u['email']).trim()) {
        patch['email'] = String(u['email']).trim();
      }
      const dobRaw = u['dateOfBirth'] ?? u['birthday'];
      if (dobRaw != null && String(dobRaw).trim()) {
        patch['dateOfBirth'] = this.toDateOnly(dobRaw);
      }
      if (Object.keys(patch).length > 0) {
        this.form.patchValue(patch);
        this.profileContactSnapshot = {
          fullName: String(this.form.get('fullName')?.value ?? '').trim(),
          email: String(this.form.get('email')?.value ?? '').trim(),
          dateOfBirth: this.toDateOnly(this.form.get('dateOfBirth')?.value ?? ''),
        };
        this.displayEmail = this.profileContactSnapshot.email;
        this.cdr.markForCheck();
      }
    } catch {
      /* ignore */
    }
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
    const selected =
      this.currentReproductiveStatus ??
      (this.form.get('status')?.value as string | null);
    if (!selected) {
      this.showErrorAlert(this.loc('editProfile.toast.chooseOptionFirst'));
      return;
    }

    const apiStatus = this.mapUiReproductiveToApiPregnancyStatus(selected);
    if (!apiStatus) {
      this.showErrorAlert(this.loc('editProfile.toast.invalidReproductiveStatus'));
      return;
    }

    this.onboardingService.updateReproductiveState({ state: apiStatus }).subscribe({
      next: (dashboard) => {
        this.form.patchValue({ status: selected });
        this.currentReproductiveStatus = selected;
        this.isEditingReproductiveStatus = false;
        this.pushHomeJourneyFromDashboard(dashboard);

        if (selected === 'PREGNANT') {
          const w = dashboard?.week;
          const week =
            w != null && Number.isFinite(w)
              ? Math.min(40, Math.max(4, Math.round(Number(w))))
              : 12;
          this.router.navigate(['/week-detail'], { queryParams: { week } });
          this.showSuccessAlert(this.loc('editProfile.toast.openingPregnancyWeek'));
          return;
        }

        if (selected === 'PLANNING_PREGNANCY') {
          this.showSuccessAlert(this.loc('editProfile.toast.savedSetupPlanning'));
          this.router.navigate(['/pregnancy-planning']);
          return;
        }

        this.showSuccessAlert(this.loc('editProfile.toast.reproductiveUpdated'));
      },
      error: (error: any) => {
        console.error('Error updating reproductive status:', error);
        this.showErrorAlert(this.loc('editProfile.toast.reproductiveUpdateFailed'));
      },
    });
  }

  /** Same path as week-detail save: home tab updates via signal even when view enter does not run. */
  private pushHomeJourneyFromDashboard(dashboard: DashboardResponse): void {
    const state = this.homeReproUi.synchronizeFromDashboardAndJourney(
      dashboard,
      this.userInfoService.onboardingJourney(),
    );
    this.homeJourneyBridge.pushJourneyStateFromWeekDetail(state);
  }

  /** Map GET user.status (account) away; align API NOT_PLANNING with UI NOT_PREGNANT. */
  private normalizeReproductiveStatusForForm(
    raw: string | null | undefined,
  ): string | null {
    if (!raw) return null;
    if (raw === 'pregnant') return 'PREGNANT';
    if (raw === 'planning') return 'PLANNING_PREGNANCY';
    if (raw === 'postpartum') return 'POSTPARTUM';
    if (raw === 'cycle') return 'NOT_PREGNANT';
    if (raw === 'ACTIVE' || raw === 'INACTIVE' || raw === 'SUSPENDED') {
      return null;
    }
    if (raw === 'NOT_PLANNING') return 'NOT_PREGNANT';
    return raw;
  }

  private mapUiReproductiveToApiPregnancyStatus(
    ui: string | null,
  ): ReproductiveStatus | null {
    if (!ui) return null;
    if (ui === 'NOT_PREGNANT') return 'cycle';
    if (ui === 'PLANNING_PREGNANCY') return 'planning';
    if (ui === 'PREGNANT') return 'pregnant';
    if (ui === 'POSTPARTUM') return 'postpartum';
    return null;
  }

  getSelectedReproductiveStatusLabel(): string {
    const opt = this.getSelectedReproductiveOption();
    return opt?.label ?? 'Not selected yet';
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
