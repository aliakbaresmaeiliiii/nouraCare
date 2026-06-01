import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Chart,
  registerables,
  type ChartConfiguration,
  type Plugin,
} from 'chart.js';

Chart.register(...registerables);
import { ModalController } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';
import { CycleSettingsService } from '../../services/cycle-settings.service';
import { LanguageService } from '../../services/language.service';
import { TranslationService } from '../../services/translation.service';
import {
  buildFertilityChartPoints,
  computeFertilityOverview,
  type FertilityChartPhase,
  type FertilityOverviewData,
  type FertilityPhase,
} from '../../utils/fertility-calc.util';
import {
  formatCyclePhaseShortDate,
  formatLocalizedNumber,
} from '../../utils/locale-date-format.util';

const PHASE_CHART_COLORS: Record<FertilityChartPhase, string> = {
  period: 'rgba(251, 113, 133, 0.22)',
  follicular: 'rgba(147, 197, 253, 0.22)',
  fertile: 'rgba(52, 211, 153, 0.28)',
  luteal: 'rgba(196, 181, 253, 0.22)',
};

const LEGEND_PHASE_COLORS: Record<FertilityChartPhase, string> = {
  period: '#fb7185',
  follicular: '#60a5fa',
  fertile: '#34d399',
  luteal: '#a78bfa',
};

@Component({
  selector: 'app-fertility-overview-sheet',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './fertility-overview-sheet.component.html',
  styleUrls: ['./fertility-overview-sheet.component.scss'],
})
export class FertilityOverviewSheetComponent implements OnInit, AfterViewInit {
  private modalCtrl = inject(ModalController);
  private cycleSettings = inject(CycleSettingsService);
  private languageService = inject(LanguageService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('fertilityChartCanvas')
  private chartCanvas?: ElementRef<HTMLCanvasElement>;

  hasData = false;
  overview: FertilityOverviewData | null = null;

  private fertilityChart: Chart | null = null;
  private chartReady = false;

  readonly legendPhases: FertilityChartPhase[] = [
    'period',
    'follicular',
    'fertile',
    'luteal',
  ];

  ngOnInit(): void {
    this.loadOverview();
    this.languageService.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadOverview();
        this.cdr.markForCheck();
        queueMicrotask(() => this.renderChart());
      });

    this.destroyRef.onDestroy(() => this.destroyChart());
  }

  ngAfterViewInit(): void {
    this.chartReady = true;
    this.renderChart();
  }

  legendLabel(phase: FertilityChartPhase): string {
    switch (phase) {
      case 'period':
        return this.translation.translate('cycleChart.fertility.period');
      case 'follicular':
        return this.translation.translate('fertilitySheet.chartFollicular');
      case 'fertile':
        return this.translation.translate('cycleChart.fertility.fertileWindow');
      case 'luteal':
        return this.translation.translate('cycleChart.fertility.lutealPhase');
    }
  }

  legendColor(phase: FertilityChartPhase): string {
    return LEGEND_PHASE_COLORS[phase];
  }

  private loadOverview(): void {
    const lmp = this.cycleSettings.lastPeriodStartDate();
    if (!lmp) {
      this.hasData = false;
      this.overview = null;
      this.destroyChart();
      return;
    }

    this.overview = computeFertilityOverview(
      lmp,
      this.cycleSettings.cycleLength() || 28,
      this.cycleSettings.periodLength() || 5,
      this.languageService.getCurrentLanguage(),
    );
    this.hasData = true;
    queueMicrotask(() => this.renderChart());
  }

  private destroyChart(): void {
    this.fertilityChart?.destroy();
    this.fertilityChart = null;
  }

  private renderChart(): void {
    if (!this.chartReady || !this.overview || !this.chartCanvas?.nativeElement) {
      return;
    }

    const canvas = this.chartCanvas.nativeElement;
    const o = this.overview;
    const lang = this.languageService.getCurrentLanguage();
    const points = buildFertilityChartPoints(
      o.cycleLength,
      o.periodLength,
      o.ovulationCycleDay,
      o.fertileStartCycleDay,
      o.fertileEndCycleDay,
    );

    const labels = points.map((p) =>
      formatLocalizedNumber(p.cycleDay, lang),
    );
    const data = points.map((p) => p.chancePercent);
    const todayIndex = o.currentCycleDay - 1;
    const ovulationIndex = o.ovulationCycleDay - 1;

    const phaseBackgroundPlugin: Plugin<'line'> = {
      id: 'fertilityPhaseBackground',
      beforeDatasetsDraw: (chart) => {
        const { ctx, chartArea, scales } = chart;
        const x = scales['x'];
        if (!chartArea || !x) return;

        let start = 0;
        let currentPhase = points[0]?.phase;
        for (let i = 1; i <= points.length; i++) {
          const phase = points[i]?.phase;
          if (phase === currentPhase && i < points.length) continue;

          const x0 = x.getPixelForValue(start);
          const x1 = x.getPixelForValue(i - 1);
          const left = Math.min(x0, x1);
          const width = Math.abs(x1 - x0);
          ctx.save();
          ctx.fillStyle = PHASE_CHART_COLORS[currentPhase];
          ctx.fillRect(
            left,
            chartArea.top,
            width,
            chartArea.bottom - chartArea.top,
          );
          ctx.restore();

          start = i;
          currentPhase = phase ?? currentPhase;
        }
      },
    };

    const markersPlugin: Plugin<'line'> = {
      id: 'fertilityMarkers',
      afterDatasetsDraw: (chart) => {
        const { ctx, chartArea, scales } = chart;
        const x = scales['x'];
        const y = scales['y'];
        if (!chartArea || !x || !y) return;

        const drawMarker = (
          index: number,
          color: string,
          label: string,
          dash = false,
        ) => {
          const px = x.getPixelForValue(index);
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.setLineDash(dash ? [5, 4] : []);
          ctx.beginPath();
          ctx.moveTo(px, chartArea.top);
          ctx.lineTo(px, chartArea.bottom);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = color;
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, px, chartArea.top - 6);
          ctx.restore();
        };

        drawMarker(
          todayIndex,
          '#0f172a',
          this.translation.translate('fertilitySheet.chartToday'),
          true,
        );
        if (ovulationIndex !== todayIndex) {
          drawMarker(
            ovulationIndex,
            '#d97706',
            this.translation.translate('fertilitySheet.chartOvulation'),
          );
        }

        const todayY = y.getPixelForValue(data[todayIndex] ?? 0);
        const todayX = x.getPixelForValue(todayIndex);
        ctx.save();
        ctx.beginPath();
        ctx.arc(todayX, todayY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      },
    };

    const gradient = canvas.getContext('2d')?.createLinearGradient(0, 0, 0, 220);
    if (gradient) {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data,
            borderColor: '#059669',
            backgroundColor: gradient ?? 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHitRadius: 12,
            fill: true,
            tension: 0.42,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 22, left: 4, right: 4 } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                const day = points[idx]?.cycleDay ?? 0;
                return this.translation.translateParams('fertilitySheet.cycleDay', {
                  day,
                  len: o.cycleLength,
                });
              },
              label: (ctx) => {
                const pct = formatLocalizedNumber(ctx.parsed.y ?? 0, lang);
                return `${this.translation.translate('fertilitySheet.chartYAxis')}: ${pct}%`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 7,
              color: '#64748b',
              font: { size: 11 },
            },
            border: { display: false },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(15, 23, 42, 0.06)' },
            ticks: {
              stepSize: 25,
              color: '#94a3b8',
              font: { size: 10 },
              callback: (value) =>
                `${formatLocalizedNumber(value, lang)}%`,
            },
            border: { display: false },
          },
        },
      },
      plugins: [phaseBackgroundPlugin, markersPlugin],
    };

    this.destroyChart();
    this.fertilityChart = new Chart(canvas, config);
  }

  dismiss(): void {
    void this.modalCtrl.dismiss();
  }

  logPeriod(): void {
    void this.modalCtrl.dismiss({ action: 'logPeriod' });
  }

  setReminder(): void {
    if (!this.overview) return;
    void this.modalCtrl.dismiss({
      action: 'setReminder',
      results: this.overview.results,
    });
  }

  trackSymptoms(): void {
    void this.modalCtrl.dismiss({ action: 'trackSymptoms' });
  }

  phaseIcon(phase: FertilityPhase): string {
    switch (phase) {
      case 'period':
        return 'water-outline';
      case 'follicular':
        return 'leaf-outline';
      case 'fertile':
        return 'sparkles-outline';
      case 'ovulation_peak':
        return 'egg-outline';
      default:
        return 'moon-outline';
    }
  }

  phaseTone(phase: FertilityPhase): string {
    switch (phase) {
      case 'period':
        return 'rose';
      case 'follicular':
        return 'sky';
      case 'fertile':
        return 'emerald';
      case 'ovulation_peak':
        return 'amber';
      default:
        return 'violet';
    }
  }

  formatRange(start: Date, end: Date): string {
    const lang = this.languageService.getCurrentLanguage();
    return `${formatCyclePhaseShortDate(start, lang)} – ${formatCyclePhaseShortDate(end, lang)}`;
  }

  formatSingle(date: Date): string {
    return formatCyclePhaseShortDate(date, this.languageService.getCurrentLanguage());
  }

  cycleDayLabel(): string {
    if (!this.overview) return '';
    return this.translation.translateParams('fertilitySheet.cycleDay', {
      day: this.overview.currentCycleDay,
      len: this.overview.cycleLength,
    }