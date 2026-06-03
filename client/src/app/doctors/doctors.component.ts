import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ActionSheetController,
  InfiniteScrollCustomEvent,
  ToastController,
} from '@ionic/angular';
import {
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { combineLatest, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DoctorService } from '../shared/services/doctor.service';
import {
  DOCTOR_SPECIALTIES,
  DoctorDisplayService,
} from '../shared/services/doctor-display.service';
import { DoctorBookingService } from '../shared/services/doctor-booking.service';
import { DoctorDto } from '../shared/models/doctor.dto';
import {
  ConsultationCategory,
  ConsultationCategoryId,
  getConsultationCategory,
} from '../shared/models/consultation-categories';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { DoctorAvatarComponent } from '../shared/components/doctor-avatar/doctor-avatar.component';
import { DoctorMedicalCodeComponent } from '../shared/components/doctor-medical-code/doctor-medical-code.component';
import { TranslationService } from '../shared/services/translation.service';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  closeCircle,
  medicalOutline,
  searchOutline,
  star,
  swapVertical,
  videocamOutline,
} from 'ionicons/icons';

type DoctorSort = 'rating' | 'experience' | 'fee';

@Component({
  selector: 'app-doctors',
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, IonInfiniteScroll, IonInfiniteScrollContent, DoctorAvatarComponent, DoctorMedicalCodeComponent],
})
export class DoctorsComponent implements OnInit, OnDestroy {
  readonly doctorDisplay = inject(DoctorDisplayService);
  private readonly doctorBooking = inject(DoctorBookingService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly pageSize = 12;

  doctors: DoctorDto[] = [];
  filteredDoctors: DoctorDto[] = [];
  totalDoctors = 0;
  isLoading = false;
  loadingMore = false;
  hasMore = true;
  searchTerm = '';
  selectedSpecialty = 'all';
  selectedConsultationType = 'all';
  selectedSort: DoctorSort = 'rating';
  selectedCategoryId: ConsultationCategoryId | null = null;

  private currentPage = 0;
  private totalPages = 1;
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private routeSub?: Subscription;

  readonly specialties = [...DOCTOR_SPECIALTIES];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private doctorService: DoctorService,
    private translation: TranslationService,
  ) {
    addIcons({
      chevronBack,
      medicalOutline,
      videocamOutline,
      swapVertical,
      closeCircle,
      searchOutline,
      star,
    });
  }

  ngOnInit() {
    this.routeSub = combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
    ]).subscribe(() => {
      this.applyRouteFilters();
      this.reloadFromApi();
    });
  }

  ngOnDestroy() {
    clearTimeout(this.searchDebounce);
    this.routeSub?.unsubscribe();
  }

  get activeCategory(): ConsultationCategory | undefined {
    return getConsultationCategory(this.selectedCategoryId ?? undefined);
  }

  get isCategoryPage(): boolean {
    return !!this.activeCategory;
  }

  get pageTitle(): string {
    if (this.activeCategory) {
      return this.translation.translate(this.activeCategory.titleKey);
    }
    return this.translation.translate('doctors.title');
  }

  categoryDoctorCountLabel(category: ConsultationCategory): string {
    return this.translation.translateParams('consultation.category.doctorCount', {
      count: category.displayCount,
    });
  }

  categoryHeroGradient(category: ConsultationCategory): string {
    return `linear-gradient(135deg, ${category.gradientFrom}, ${category.gradientTo})`;
  }

  trackByDoctorId(_index: number, doctor: DoctorDto): string {
    return doctor.id ?? String(_index);
  }

  specialtyFilterLabel(): string {
    if (this.selectedSpecialty === 'all') {
      return this.translation.translate('doctors.filterSpecialty');
    }
    return this.doctorDisplay.getSpecialtyLabel(this.selectedSpecialty);
  }

  consultationFilterLabel(): string {
    switch (this.selectedConsultationType) {
      case 'ONLINE':
        return this.translation.translate('doctors.filter.onlineOnly');
      case 'IN_PERSON':
        return this.translation.translate('doctors.filter.inPersonOnly');
      case 'BOTH':
        return this.translation.translate('doctors.filter.bothAvailable');
      default:
        return this.translation.translate('doctors.filterConsultation');
    }
  }

  sortFilterLabel(): string {
    switch (this.selectedSort) {
      case 'experience':
        return this.translation.translate('consultation.filter.sortExperience');
      case 'fee':
        return this.translation.translate('consultation.filter.sortFee');
      default:
        return this.translation.translate('consultation.filter.sortRating');
    }
  }

  resultsSummaryLabel(): string {
    return this.translation.translateParams('doctors.resultsSummary', {
      shown: this.filteredDoctors.length,
      total: this.totalDoctors,
    });
  }

  private applyRouteFilters(): void {
    const pathCategory = this.route.snapshot.paramMap.get('categoryId');
    const queryCategory = this.route.snapshot.queryParamMap.get('category');
    const category = getConsultationCategory(pathCategory || queryCategory);

    this.selectedCategoryId = category?.id ?? null;
    this.selectedSpecialty = category?.apiFilter.specialty ?? 'all';

    const type = this.route.snapshot.queryParamMap.get('type');
    this.selectedConsultationType =
      type && ['ONLINE', 'IN_PERSON', 'BOTH'].includes(type) ? type : 'all';

    const sort = this.route.snapshot.queryParamMap.get('sort');
    this.selectedSort =
      sort === 'experience' || sort === 'fee' || sort === 'rating' ? sort : 'rating';

    this.searchTerm = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.cdr.markForCheck();
  }

  reloadFromApi() {
    clearTimeout(this.searchDebounce);
    this.currentPage = 0;
    this.totalPages = 1;
    this.hasMore = true;
    this.doctors = [];
    this.filteredDoctors = [];
    void this.fetchPage(true);
  }

  loadMore() {
    void this.fetchPage(false);
  }

  onInfiniteScroll(event: InfiniteScrollCustomEvent): void {
    void this.fetchPage(false).finally(() => {
      void event.target.complete();
    });
  }

  private fetchPage(isInitial: boolean): Promise<void> {
    if (this.loadingMore || (!isInitial && !this.hasMore)) {
      return Promise.resolve();
    }

    const nextPage = isInitial ? 1 : this.currentPage + 1;
    if (!isInitial && nextPage > this.totalPages) {
      this.hasMore = false;
      this.cdr.markForCheck();
      return Promise.resolve();
    }

    this.loadingMore = true;
    if (isInitial) {
      this.isLoading = true;
    }
    this.cdr.markForCheck();

    return new Promise((resolve) => {
      this.doctorService
        .getDoctorsPage({
          page: nextPage,
          limit: this.pageSize,
          search: this.buildSearchQuery(),
          specialty: this.selectedSpecialty === 'all' ? undefined : this.selectedSpecialty,
          consultationType:
            this.selectedConsultationType === 'all' ? undefined : this.selectedConsultationType,
        })
        .pipe(
          finalize(() => {
            this.loadingMore = false;
            this.isLoading = false;
            this.cdr.markForCheck();
            resolve();
          }),
        )
        .subscribe({
          next: (res) => {
            this.totalDoctors = res.total;
            this.totalPages = res.totalPages;
            this.currentPage = res.page;
            this.hasMore = res.hasMore;
            const batch = this.sortDoctors(res.items);
            if (isInitial) {
              this.doctors = batch;
            } else {
              const existing = new Set(this.doctors.map((d) => d.id).filter(Boolean));
              const appended = batch.filter((d) => d.id && !existing.has(d.id));
              this.doctors = [...this.doctors, ...appended];
            }
            this.filteredDoctors = this.doctors;
          },
          error: async () => {
            await this.showToast(this.translation.translate('doctors.toast.loadFailed'), 'danger');
          },
        });
    });
  }

  searchDoctors(event: Event) {
    const value = (event.target as HTMLIonSearchbarElement)?.value ?? '';
    this.searchTerm = typeof value === 'string' ? value : '';
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.reloadFromApi(), 350);
  }

  async toggleSpecialtyFilter() {
    const sheet = await this.actionSheetController.create({
      header: this.translation.translate('doctors.filter.specialtyHeader'),
      buttons: [
        {
          text: this.translation.translate('doctors.filter.allSpecialties'),
          handler: () => {
            this.selectedSpecialty = 'all';
            this.reloadFromApi();
          },
        },
        ...this.specialties.map((s) => ({
          text: this.doctorDisplay.getSpecialtyLabel(s),
          handler: () => {
            this.selectedSpecialty = s;
            this.reloadFromApi();
          },
        })),
        { text: this.translation.translate('doctors.filter.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async toggleConsultationFilter() {
    const sheet = await this.actionSheetController.create({
      header: this.translation.translate('doctors.filter.consultationHeader'),
      buttons: [
        {
          text: this.translation.translate('doctors.filter.allTypes'),
          handler: () => {
            this.selectedConsultationType = 'all';
            this.reloadFromApi();
          },
        },
        {
          text: this.translation.translate('doctors.filter.onlineOnly'),
          handler: () => {
            this.selectedConsultationType = 'ONLINE';
            this.reloadFromApi();
          },
        },
        {
          text: this.translation.translate('doctors.filter.inPersonOnly'),
          handler: () => {
            this.selectedConsultationType = 'IN_PERSON';
            this.reloadFromApi();
          },
        },
        {
          text: this.translation.translate('doctors.filter.bothAvailable'),
          handler: () => {
            this.selectedConsultationType = 'BOTH';
            this.reloadFromApi();
          },
        },
        { text: this.translation.translate('doctors.filter.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async toggleSortFilter() {
    const sheet = await this.actionSheetController.create({
      header: this.translation.translate('consultation.filter.sortHeader'),
      buttons: [
        {
          text: this.translation.translate('consultation.filter.sortRating'),
          handler: () => {
            this.selectedSort = 'rating';
            this.applySortToList();
          },
        },
        {
          text: this.translation.translate('consultation.filter.sortExperience'),
          handler: () => {
            this.selectedSort = 'experience';
            this.applySortToList();
          },
        },
        {
          text: this.translation.translate('consultation.filter.sortFee'),
          handler: () => {
            this.selectedSort = 'fee';
            this.applySortToList();
          },
        },
        { text: this.translation.translate('doctors.filter.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedConsultationType = 'all';
    this.selectedSort = 'rating';
    const category = this.activeCategory;
    this.selectedSpecialty = category?.apiFilter.specialty ?? 'all';
    if (!category) {
      this.selectedCategoryId = null;
    }
    this.reloadFromApi();
  }

  hasActiveFilters(): boolean {
    const categoryDefault = this.activeCategory?.apiFilter.specialty ?? 'all';
    return (
      this.searchTerm.length > 0 ||
      this.selectedSpecialty !== categoryDefault ||
      this.selectedConsultationType !== 'all' ||
      this.selectedSort !== 'rating'
    );
  }

  private buildSearchQuery(): string | undefined {
    const category = getConsultationCategory(this.selectedCategoryId ?? undefined);
    const combined = [category?.apiFilter.search, this.searchTerm.trim()]
      .filter(Boolean)
      .join(' ')
      .trim();
    return combined || undefined;
  }

  private applySortToList(): void {
    this.doctors = this.sortDoctors(this.doctors);
    this.filteredDoctors = this.doctors;
    this.cdr.markForCheck();
  }

  private sortDoctors(items: DoctorDto[]): DoctorDto[] {
    const sorted = [...items];
    switch (this.selectedSort) {
      case 'experience':
        return sorted.sort((a, b) => b.experienceYears - a.experienceYears);
      case 'fee':
        return sorted.sort(
          (a, b) => (a.fee ?? Number.MAX_SAFE_INTEGER) - (b.fee ?? Number.MAX_SAFE_INTEGER),
        );
      default:
        return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
  }

  openDoctorBooking(doctor: DoctorDto) {
    void this.doctorBooking.openBooking(doctor);
  }

  bookWithDoctor(doctor: DoctorDto) {
    this.openDoctorBooking(doctor);
  }

  viewDoctorProfile(doctor: DoctorDto) {
    if (!doctor.id) {
      return;
    }
    void this.router.navigate(['/doctor', doctor.id]);
  }

  getConsultationTypeLabel(type: string): string {
    return this.doctorDisplay.getShortConsultationTypeLabel(type);
  }

  goBack() {
    void this.router.navigate(['/tabs/consultation']);
  }

  goToAllDoctors() {
    void this.router.navigate(['/doctors']);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
