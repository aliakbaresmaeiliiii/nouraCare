import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import {
  BabyDevelopmentService,
  BabySizeData,
} from '../shared/services/baby-development.service';
import { TranslationService } from '../shared/services/translation.service';
import { LanguageService } from '../shared/services/language.service';
import { PregnancyWeekProgressComponent } from '../shared/components/pregnancy-week-progress/pregnancy-week-progress.component';

@Component({
  selector: 'app-school',
  templateUrl: './school.component.html',
  styleUrls: ['./school.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, PregnancyWeekProgressComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class SchoolComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly cycleSettings = inject(CycleSettingsService);
  private readonly babyDevelopmentService = inject(BabyDevelopmentService);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private langChangeSub?: Subscription;

  /** Week shown on screen (user can explore 4–40). */
  pregnancyWeek = 12;
  /** Week from profile / cycle (source of truth after refresh). */
  actualPregnancyWeek = 12;
  isPregnant = false;
  currentBaby: BabySizeData | null = null;

  ngOnInit() {
    this.langChangeSub = this.languageService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
    this.loadPregnancyData();
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }

  get exploreBannerText(): string {
    return this.tParams('school.explore.viewing', {
      week: this.pregnancyWeek,
      actualWeek: this.actualPregnancyWeek,
    });
  }

  get weekLabel(): string {
    return this.tParams('school.week.label', { week: this.pregnancyWeek });
  }

  private loadPregnancyData() {
    this.isPregnant = this.cycleSettings.isPregnant();
    this.actualPregnancyWeek = this.cycleSettings.pregnancyWeek();
    this.pregnancyWeek = this.actualPregnancyWeek;

    if (this.isPregnant) {
      this.syncBabyToDisplayedWeek();
    } else {
      this.currentBaby = null;
    }
  }

  /** True when browsing a week other than the one saved in the profile. */
  get isExploringOtherWeek(): boolean {
    return this.isPregnant && this.pregnancyWeek !== this.actualPregnancyWeek;
  }

  private syncBabyToDisplayedWeek(): void {
    const w = Math.max(4, Math.min(40, Math.floor(this.pregnancyWeek)));
    this.pregnancyWeek = w;
    this.currentBaby = this.babyDevelopmentService.getBabySizeForWeek(w);
  }

  onWeekProgressChange(week: number): void {
    this.pregnancyWeek = Math.max(4, Math.min(40, Math.round(week)));
    this.syncBabyToDisplayedWeek();
  }

  resetToProfileWeek(): void {
    this.pregnancyWeek = this.actualPregnancyWeek;
    this.syncBabyToDisplayedWeek();
  }

  displayBabySize(): string {
    const key = `school.size.w${this.pregnancyWeek}`;
    const translated = this.t(key);
    if (translated !== key) {
      return translated;
    }
    return this.currentBaby?.size || this.t('school.size.growing');
  }

  displayBabyDescription(): string {
    const key = `school.sizeDesc.w${this.pregnancyWeek}`;
    const translated = this.t(key);
    if (translated !== key) {
      return translated;
    }
    return this.currentBaby?.description || this.t('school.size.defaultDesc');
  }

  getBabyDevelopmentFacts(week: number): string {
    return this.weekText('school.dev', week);
  }

  getFunFacts(week: number): string {
    return this.weekText('school.fun', week);
  }

  getBabyLength(): string {
    return this.weekText('school.length', this.pregnancyWeek);
  }

  previousWeek() {
    if (this.pregnancyWeek > 4) {
      this.pregnancyWeek--;
      this.syncBabyToDisplayedWeek();
    }
  }

  nextWeek() {
    if (this.pregnancyWeek < 40) {
      this.pregnancyWeek++;
      this.syncBabyToDisplayedWeek();
    }
  }

  goToHome() {
    this.router.navigate(['/tabs/home']);
  }

  /** Pull-to-refresh on School tab (layout). */
  async runPullToRefresh(): Promise<void> {
    this.loadPregnancyData();
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

  private weekText(prefix: string, week: number): string {
    const key = `${prefix}.w${week}`;
    const translated = this.t(key);
    if (translated !== key) {
      return translated;
    }
    return this.t(`${prefix}.default`);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private tParams(
    key: string,
    params: Record<string, string | number>,
  ): string {
    return this.translation.translateParams(key, params);
  }
}
