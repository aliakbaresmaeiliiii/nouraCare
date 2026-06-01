import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { LocalizedNumberPipe } from '../../pipes/localized-number.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-pregnancy-week-progress',
  standalone: true,
  imports: [CommonModule, LocalizedNumberPipe, TranslatePipe],
  templateUrl: './pregnancy-week-progress.component.html',
  styleUrl: './pregnancy-week-progress.component.scss',
})
export class PregnancyWeekProgressComponent {
  private translation = inject(TranslationService);

  /** Currently displayed / selected week (1–40). */
  week = input.required<number>();
  minWeek = input(1);
  maxWeek = input(40);
  /** Saved profile week — shown as a marker when browsing another week. */
  profileWeek = input<number | null>(null);
  /** Hide tappable segments (display-only). */
  readonly = input(false);

  weekChange = output<number>();

  readonly weeks = computed(() => {
    const min = this.minWeek();
    const max = this.maxWeek();
    const count = Math.max(0, max - min + 1);
    return Array.from({ length: count }, (_, i) => min + i);
  });

  readonly fillPercent = computed(() => {
    const min = this.minWeek();
    const max = this.maxWeek();
    const span = max - min;
    if (span <= 0) {
      return 0;
    }
    return ((this.week() - min) / span) * 100;
  });

  readonly progressPercent = computed(() =>
    Math.round((this.week() / this.maxWeek()) * 100),
  );

  readonly showProfileMarker = computed(() => {
    const profile = this.profileWeek();
    return (
      profile != null &&
      profile >= this.minWeek() &&
      profile <= this.maxWeek() &&
      profile !== this.week()
    );
  });

  selectWeek(w: number): void {
    if (this.readonly()) {
      return;
    }
    this.weekChange.emit(w);
  }

  isPast(w: number): boolean {
    return w < this.week();
  }

  isCurrent(w: number): boolean {
    return w === this.week();
  }

  isProfile(w: number): boolean {
    return this.profileWeek() === w;
  }

  weekAriaLabel(w: number): string {
    return this.translation.translateParams('pregnancyWeekProgress.weekAria', {
      week: w,
    });
  }
}
