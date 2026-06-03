import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { IonCheckbox } from '@ionic/angular/standalone';
import { CycleSettingsService } from '../../shared/services/cycle-settings.service';
import { LanguageService } from '../../shared/services/language.service';
import { TranslationService } from '../../shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';
import { getToolItemByRoute, ToolMenuItem } from '../tool-pages.config';
import {
  BABY_NAMES,
  CHECKLIST_PAGES,
  CONTENT_PAGES,
  GROWTH_QUIZ,
  LULLABIES,
  MEMORY_EMOJIS,
  RECIPES,
  SHOP_PRODUCTS,
  STORIES,
  TRACKER_CONFIG,
} from '../tool-pages.data';
import {
  GrowthEntry,
  MemoryEntry,
  ToolStorageService,
  TrackerEntry,
} from '../services/tool-storage.service';

@Component({
  selector: 'app-tool-generic-page',
  templateUrl: './tool-generic-page.component.html',
  styleUrls: ['./tool-generic-page.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, IonCheckbox],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolGenericPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storage = inject(ToolStorageService);
  private readonly fb = inject(FormBuilder);
  private readonly toastCtrl = inject(ToastController);
  private readonly translation = inject(TranslationService);
  private readonly cycleSettings = inject(CycleSettingsService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('activeAudio') activeAudio?: ElementRef<HTMLAudioElement>;

  menuItem!: ToolMenuItem;
  pageRoute = '';

  // Content
  contentCards = CONTENT_PAGES;
  checklistItems = CHECKLIST_PAGES;
  recipes = RECIPES;
  lullabies = LULLABIES;
  stories = STORIES;
  babyNames = BABY_NAMES;
  quizQuestions = GROWTH_QUIZ;
  shopProducts = SHOP_PRODUCTS;
  memoryEmojis = MEMORY_EMOJIS;

  checklistState: Record<string, boolean> = {};
  trackerEntries: TrackerEntry[] = [];
  growthEntries: GrowthEntry[] = [];
  memories: MemoryEntry[] = [];
  favoriteNames: string[] = [];
  kickCount = 0;
  kickTimerSeconds = 0;
  kickTimerRunning = false;
  private kickInterval?: ReturnType<typeof setInterval>;

  selectedStoryId: string | null = null;
  playingLullabyId: string | null = null;
  nameFilter = 'all';
  nameSearch = '';

  quizStep = 0;
  quizAnswers: Record<string, number> = {};
  quizFinished = false;

  trackerForm = this.fb.group({
    value: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    notes: ['', Validators.maxLength(200)],
  });

  growthForm = this.fb.group({
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    weightKg: ['', Validators.required],
    heightCm: ['', Validators.required],
  });

  private static readonly CHART_BAR_MAX_PX = 112;

  memoryForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    note: ['', Validators.maxLength(300)],
    emoji: ['👶', Validators.required],
  });

  cordBloodForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^[\d+\-\s()]{8,15}$/)]],
    hospital: ['', Validators.required],
    dueDate: ['', Validators.required],
    consent: [false, Validators.requiredTrue],
  });

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.pageRoute = data['pageRoute'] as string;
      const item = getToolItemByRoute(this.pageRoute);
      if (!item) return;
      this.menuItem = item;
      this.loadPageData();
      this.cdr.markForCheck();
    });

    this.languageService.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  get pageType(): string {
    return this.menuItem?.pageType ?? 'content';
  }

  get titleKey(): string {
    return this.menuItem?.titleKey ?? '';
  }

  get descKey(): string {
    return this.menuItem?.descKey ?? '';
  }

  get contentList() {
    return CONTENT_PAGES[this.pageRoute] ?? [];
  }

  get checklistList() {
    return CHECKLIST_PAGES[this.pageRoute] ?? [];
  }

  get checklistProgress(): number {
    const items = this.checklistList;
    if (!items.length) return 0;
    const done = items.filter((i) => this.checklistState[i.id]).length;
    return Math.round((done / items.length) * 100);
  }

  get trackerConfig() {
    return TRACKER_CONFIG[this.pageRoute];
  }

  get chartBars(): { label: string; value: number; heightPx: number }[] {
    return this.buildBarSeries(
      this.trackerEntries.slice(-7).map((e) => ({
        label: e.date.slice(5),
        value: Number(e.value),
      })),
    );
  }

  get growthWeightBars(): { label: string; value: number; heightPx: number }[] {
    return this.buildBarSeries(
      this.growthEntries.map((e) => ({
        label: e.date.slice(5),
        value: Number(e.weightKg),
      })),
    );
  }

  get growthHeightBars(): { label: string; value: number; heightPx: number }[] {
    return this.buildBarSeries(
      this.growthEntries.map((e) => ({
        label: e.date.slice(5),
        value: Number(e.heightCm),
      })),
    );
  }

  private buildBarSeries(
    points: { label: string; value: number }[],
  ): { label: string; value: number; heightPx: number }[] {
    if (!points.length) return [];
    const max = Math.max(...points.map((p) => p.value), 1);
    return points.map((p) => ({
      label: p.label,
      value: p.value,
      heightPx: Math.max(6, Math.round((p.value / max) * ToolGenericPageComponent.CHART_BAR_MAX_PX)),
    }));
  }

  get pregnancyWeek(): number {
    return this.cycleSettings.pregnancyWeek() || 1;
  }

  get pregnancyProgress(): number {
    return Math.min(100, Math.round((this.pregnancyWeek / 40) * 100));
  }

  get trimesterLabel(): string {
    const w = this.pregnancyWeek;
    if (w <= 13) return this.t('toolPage.trimester1');
    if (w <= 27) return this.t('toolPage.trimester2');
    return this.t('toolPage.trimester3');
  }

  get filteredNames() {
    return this.babyNames.filter((n) => {
      const matchGender =
        this.nameFilter === 'all' || n.gender === this.nameFilter;
      const q = this.nameSearch.trim();
      const matchSearch =
        !q || n.name.includes(q) || this.t(n.meaningKey).includes(q);
      return matchGender && matchSearch;
    });
  }

  get quizScore(): number {
    return Object.values(this.quizAnswers).reduce((a, b) => a + b, 0);
  }

  get quizResultKey(): string {
    const max = this.quizQuestions.length * 3;
    const ratio = this.quizScore / max;
    if (ratio >= 0.8) return 'toolPage.quiz.resultGreat';
    if (ratio >= 0.5) return 'toolPage.quiz.resultGood';
    return 'toolPage.quiz.resultReview';
  }

  private loadPageData(): void {
    if (this.pageType === 'checklist') {
      this.checklistState = this.storage.getChecklist(this.pageRoute);
    }
    if (this.pageType === 'tracker') {
      this.trackerEntries = this.storage.getTracker(this.pageRoute);
    }
    if (this.pageType === 'growth-chart') {
      this.growthEntries = this.storage.getGrowthEntries();
    }
    if (this.pageType === 'memory-album') {
      this.memories = this.storage.getMemories();
    }
    if (this.pageType === 'baby-names') {
      this.favoriteNames = this.storage.getFavoriteNames();
    }
    if (this.pageType === 'cord-blood') {
      const saved = this.storage.getCordBloodRegistration();
      if (saved) this.cordBloodForm.patchValue(saved as never);
    }
  }

  toggleChecklist(itemId: string): void {
    this.checklistState = this.storage.toggleChecklistItem(this.pageRoute, itemId);
    this.cdr.markForCheck();
  }

  submitTracker(): void {
    if (this.trackerForm.invalid) {
      this.trackerForm.markAllAsTouched();
      return;
    }
    const v = this.trackerForm.value;
    this.trackerEntries = this.storage.addTrackerEntry(this.pageRoute, {
      date: new Date().toISOString().slice(0, 10),
      value: v.value!,
      notes: v.notes ?? undefined,
    });
    this.trackerForm.patchValue({ notes: '' });
    void this.showToast('toolPage.toast.trackerSaved', 'success');
    this.cdr.markForCheck();
  }

  submitGrowth(): void {
    if (this.growthForm.get('date')?.invalid) {
      this.growthForm.markAllAsTouched();
      return;
    }
    const v = this.growthForm.value;
    const weightKg = Number(v.weightKg);
    const heightCm = Number(v.heightCm);

    if (!Number.isFinite(weightKg) || weightKg < 0.5 || weightKg > 30) {
      this.growthForm.get('weightKg')?.setErrors({ invalid: true });
      this.growthForm.get('weightKg')?.markAsTouched();
      void this.showToast('toolPage.toast.invalidWeight', 'warning');
      return;
    }
    if (!Number.isFinite(heightCm) || heightCm < 30 || heightCm > 120) {
      this.growthForm.get('heightCm')?.setErrors({ invalid: true });
      this.growthForm.get('heightCm')?.markAsTouched();
      void this.showToast('toolPage.toast.invalidHeight', 'warning');
      return;
    }

    this.growthEntries = this.storage.addGrowthEntry({
      date: v.date!,
      weightKg,
      heightCm,
    });
    this.growthForm.patchValue({ weightKg: '', heightCm: '' });
    void this.showToast('toolPage.toast.growthSaved', 'success');
    this.cdr.markForCheck();
  }

  submitMemory(): void {
    if (this.memoryForm.invalid) {
      this.memoryForm.markAllAsTouched();
      return;
    }
    const v = this.memoryForm.value;
    this.memories = this.storage.addMemory({
      id: crypto.randomUUID(),
      title: v.title!,
      note: v.note ?? '',
      date: new Date().toISOString().slice(0, 10),
      emoji: v.emoji!,
    });
    this.memoryForm.reset({ emoji: '👶', title: '', note: '' });
    void this.showToast('toolPage.toast.memorySaved', 'success');
    this.cdr.markForCheck();
  }

  removeMemory(id: string): void {
    this.memories = this.storage.removeMemory(id);
    this.cdr.markForCheck();
  }

  submitCordBlood(): void {
    if (this.cordBloodForm.invalid) {
      this.cordBloodForm.markAllAsTouched();
      return;
    }
    this.storage.saveCordBloodRegistration(this.cordBloodForm.value as Record<string, string>);
    void this.showToast('toolPage.toast.cordBloodSaved', 'success');
  }

  toggleFavoriteName(name: string): void {
    this.favoriteNames = this.storage.toggleFavoriteName(name);
    this.cdr.markForCheck();
  }

  isFavorite(name: string): boolean {
    return this.favoriteNames.includes(name);
  }

  startKickSession(): void {
    this.kickCount = 0;
    this.kickTimerSeconds = 0;
    this.kickTimerRunning = true;
    this.kickInterval = setInterval(() => {
      this.kickTimerSeconds++;
      this.cdr.markForCheck();
    }, 1000);
    this.cdr.markForCheck();
  }

  addKick(): void {
    if (!this.kickTimerRunning) return;
    this.kickCount++;
    this.cdr.markForCheck();
  }

  stopKickSession(): void {
    if (this.kickInterval) clearInterval(this.kickInterval);
    this.kickTimerRunning = false;
    if (this.kickCount > 0) {
      this.storage.saveKickSession({
        id: crypto.randomUUID(),
        startedAt: new Date().toISOString(),
        kicks: this.kickCount,
        durationMinutes: Math.ceil(this.kickTimerSeconds / 60),
      });
      void this.showToast('toolPage.toast.kickSaved', 'success');
    }
    this.cdr.markForCheck();
  }

  formatKickTime(): string {
    const m = Math.floor(this.kickTimerSeconds / 60);
    const s = this.kickTimerSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  playLullaby(id: string, url: string): void {
    if (this.playingLullabyId === id) {
      this.activeAudio?.nativeElement.pause();
      this.playingLullabyId = null;
    } else {
      this.playingLullabyId = id;
      setTimeout(() => {
        const el = this.activeAudio?.nativeElement;
        if (el) {
          el.src = url;
          void el.play().catch(() => {
            void this.showToast('toolPage.toast.audioFailed', 'warning');
          });
        }
      });
    }
    this.cdr.markForCheck();
  }

  onAudioEnded(): void {
    this.playingLullabyId = null;
    this.cdr.markForCheck();
  }

  openStory(id: string): void {
    this.selectedStoryId = this.selectedStoryId === id ? null : id;
    this.cdr.markForCheck();
  }

  selectQuizOption(questionId: string, score: number): void {
    this.quizAnswers[questionId] = score;
    this.cdr.markForCheck();
  }

  nextQuizStep(): void {
    const q = this.quizQuestions[this.quizStep];
    if (!this.quizAnswers[q.id]) {
      void this.showToast('toolPage.toast.selectAnswer', 'warning');
      return;
    }
    if (this.quizStep < this.quizQuestions.length - 1) {
      this.quizStep++;
    } else {
      this.quizFinished = true;
    }
    this.cdr.markForCheck();
  }

  resetQuiz(): void {
    this.quizStep = 0;
    this.quizAnswers = {};
    this.quizFinished = false;
    this.cdr.markForCheck();
  }

  setNameFilter(filter: string): void {
    this.nameFilter = filter;
    this.cdr.markForCheck();
  }

  t(key: string, params?: Record<string, string | number>): string {
    return params
      ? this.translation.translateParams(key, params)
      : this.translation.translate(key);
  }

  fieldError(form: 'tracker' | 'growth' | 'memory' | 'cord', field: string): boolean {
    const f =
      form === 'tracker'
        ? this.trackerForm.get(field)
        : form === 'growth'
          ? this.growthForm.get(field)
          : form === 'memory'
            ? this.memoryForm.get(field)
            : this.cordBloodForm.get(field);
    return !!(f && f.invalid && f.touched);
  }

  private async showToast(
    key: string,
    color: 'success' | 'danger' | 'warning' = 'success',
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.t(key),
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
