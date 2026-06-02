import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import type { DailyInsightSlide, DailyInsightTopic } from '../../models/daily-insight-topic.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-daily-insights-story-modal',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, TranslatePipe],
  templateUrl: './daily-insights-story-modal.component.html',
  styleUrl: './daily-insights-story-modal.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class DailyInsightsStoryModalComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private readonly modalCtrl = inject(ModalController);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) topic!: DailyInsightTopic;

  @Input() secondsPerSlide = 8.5;

  @ViewChild('swiperHost', { read: ElementRef })
  swiperHost?: ElementRef<
    HTMLElement & {
      swiper?: { slideNext: () => void; slidePrev: () => void; activeIndex: number };
      initialize?: () => void;
    }
  >;

  activeIndex = 0;
  progressFrac = 0;
  slides: DailyInsightSlide[] = [];

  private progressRaf: number | null = null;
  /** Fires slide advance even when `requestAnimationFrame` is throttled (background tab, etc.). */
  private segmentAdvanceTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private segmentStartMs = 0;
  private swiperReadyListener?: (ev: Event) => void;
  private swiperSlideChangeOff?: () => void;
  private swiperHooksAttached = false;

  ngOnInit(): void {
    addIcons({ close });
    this.slides = this.topic?.slides?.length
      ? this.topic.slides
      : [{ title: this.topic.categoryLabel, body: this.topic.teaser }];
  }

  ngAfterViewInit(): void {
    const host = this.swiperHost?.nativeElement;
    if (!host) {
      return;
    }
    const attachHooks = () => {
      if (this.swiperHooksAttached) {
        return;
      }
      const swiper = host.swiper as
        | {
            activeIndex: number;
            on: (ev: string, fn: () => void) => void;
            off?: (ev: string, fn: () => void) => void;
          }
        | undefined;
      if (!swiper?.on) {
        return;
      }
      const onSlide = () => {
        this.activeIndex = swiper.activeIndex;
        this.restartSegmentTimer();
        this.cdr.markForCheck();
      };
      swiper.on('slideChange', onSlide);
      this.swiperSlideChangeOff = () => swiper.off?.('slideChange', onSlide);
      this.swiperHooksAttached = true;
      this.activeIndex = swiper.activeIndex;
      this.restartSegmentTimer();
      this.cdr.markForCheck();
    };

    this.swiperReadyListener = () => attachHooks();
    host.addEventListener('swiper', this.swiperReadyListener);
    queueMicrotask(() => {
      host.initialize?.();
      attachHooks();
    });
    setTimeout(() => attachHooks(), 280);
  }

  ngOnDestroy(): void {
    const host = this.swiperHost?.nativeElement;
    if (host && this.swiperReadyListener) {
      host.removeEventListener('swiper', this.swiperReadyListener);
    }
    this.swiperSlideChangeOff?.();
    this.swiperHooksAttached = false;
    this.clearSegmentTimers();
  }

  dismiss(): void {
    this.clearSegmentTimers();
    void this.modalCtrl.dismiss();
  }

  onTapDeck(ev: MouseEvent | TouchEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x =
      'touches' in ev && ev.touches[0]
        ? ev.touches[0].clientX
        : (ev as MouseEvent).clientX;
    const ratio = (x - rect.left) / rect.width;
    if (ratio < 0.34) {
      this.goPrev();
    } else if (ratio > 0.66) {
      this.goNext();
    }
    // Center: do not reset the clock — stories keep auto-advancing until the user closes or reaches the end.
  }

  private initIfNeeded(): void {
    this.swiperHost?.nativeElement?.initialize?.();
  }

  private goNext(): void {
    const swiper = this.swiperHost?.nativeElement?.swiper;
    if (!swiper) {
      return;
    }
    if (this.activeIndex >= this.slides.length - 1) {
      this.dismiss();
      return;
    }
    swiper.slideNext();
  }

  private goPrev(): void {
    const swiper = this.swiperHost?.nativeElement?.swiper;
    if (!swiper) {
      return;
    }
    if (this.activeIndex <= 0) {
      this.dismiss();
      return;
    }
    swiper.slidePrev();
  }

  private clearProgressRaf(): void {
    if (this.progressRaf !== null) {
      cancelAnimationFrame(this.progressRaf);
      this.progressRaf = null;
    }
  }

  private clearSegmentTimers(): void {
    this.clearProgressRaf();
    if (this.segmentAdvanceTimeoutId !== null) {
      clearTimeout(this.segmentAdvanceTimeoutId);
      this.segmentAdvanceTimeoutId = null;
    }
  }

  private restartSegmentTimer(): void {
    this.clearSegmentTimers();
    this.segmentStartMs = performance.now();
    this.progressFrac = 0;
    const ms = Math.max(3000, (this.secondsPerSlide || 6) * 1000);

    const tick = () => {
      const t = performance.now() - this.segmentStartMs;
      this.progressFrac = Math.min(1, t / ms);
      this.cdr.markForCheck();
      if (t < ms) {
        this.progressRaf = requestAnimationFrame(tick);
      } else {
        this.progressRaf = null;
      }
    };
    this.progressRaf = requestAnimationFrame(tick);

    this.segmentAdvanceTimeoutId = setTimeout(() => {
      this.segmentAdvanceTimeoutId = null;
      this.clearProgressRaf();
      this.goNext();
    }, ms);
  }

  segmentFillWidth(i: number): string {
    if (i < this.activeIndex) {
      return '100%';
    }
    if (i > this.activeIndex) {
      return '0%';
    }
    return `${Math.round(this.progressFrac * 1000) / 10}%`;
  }
}
