import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  Plugin,
  registerables,
  TooltipItem,
} from 'chart.js';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TranslationService } from '@app/shared/services/translation.service';

let registered = false;
function ensureChart(): void {
  if (!registered) {
    Chart.register(...registerables);
    registered = true;
  }
}

export type AdminChartKind =
  | 'line'
  | 'area'
  | 'bar'
  | 'horizontalBar'
  | 'pie'
  | 'donut';

/** Brand-aligned chart colors — indigo → teal → sky. */
const PALETTE = [
  '#6366f1',
  '#14b8a6',
  '#818cf8',
  '#0d9488',
  '#4f46e5',
  '#2dd4bf',
  '#60a5fa',
  '#f59e0b',
];

/** Draws total in the middle of a doughnut. */
const donutCenterPlugin: Plugin = {
  id: 'adminDonutCenter',
  afterDraw(chart) {
    const opts = chart.options.plugins as
      | { adminDonutCenter?: { text?: string; subtext?: string } }
      | undefined;
    const cfg = opts?.adminDonutCenter;
    if (!cfg?.text || (chart.config as { type?: string }).type !== 'doughnut') {
      return;
    }

    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle =
      getComputedStyle(chart.canvas).getPropertyValue('--admin-ink')?.trim() ||
      '#1e2433';
    ctx.font = '700 1.45rem Vazirmatn, Sora, system-ui, sans-serif';
    ctx.fillText(cfg.text, cx, cy - (cfg.subtext ? 10 : 0));
    if (cfg.subtext) {
      ctx.fillStyle =
        getComputedStyle(chart.canvas).getPropertyValue('--admin-muted')?.trim() ||
        '#6b7289';
      ctx.font = '600 0.72rem Vazirmatn, Sora, system-ui, sans-serif';
      ctx.fillText(cfg.subtext, cx, cy + 14);
    }
    ctx.restore();
  },
};

@Component({
  selector: 'app-admin-chart',
  standalone: true,
  imports: [TranslatePipe],
  template: `<div class="chart-wrap" [style.min-height.px]="height()">
    <canvas #canvas [attr.aria-label]="'admin.common.chart' | translate"></canvas>
  </div>`,
  styles: `
    :host {
      display: block;
      width: 100%;
      color: var(--admin-ink);
    }
    .chart-wrap {
      position: relative;
      width: 100%;
      height: 100%;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `,
})
export class AdminChartComponent implements AfterViewInit, OnDestroy {
  private readonly i18n = inject(TranslationService);
  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  readonly kind = input<AdminChartKind>('line');
  readonly labels = input<string[]>([]);
  readonly datasets = input<
    Array<{ label: string; data: number[]; color?: string; fill?: boolean }>
  >([]);
  readonly height = input(240);
  /** Optional center label for donut (defaults to sum). */
  readonly centerLabel = input<string>('');
  readonly centerSubLabel = input<string>('');

  constructor() {
    effect(() => {
      this.kind();
      this.labels();
      this.datasets();
      this.centerLabel();
      this.centerSubLabel();
      this.height();
      // Re-draw when UI language changes (center "Total", tooltips, etc.).
      this.i18n.translate('admin.common.chart');
      if (this.chart) this.render();
    });
  }

  ngAfterViewInit(): void {
    ensureChart();
    this.render();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    ensureChart();
    const el = this.canvas().nativeElement;
    this.chart?.destroy();

    const kind = this.kind();
    const labels = this.labels();
    const raw = this.datasets();
    const isPie = kind === 'pie' || kind === 'donut';
    const type: ChartType =
      kind === 'horizontalBar'
        ? 'bar'
        : kind === 'area'
          ? 'line'
          : kind === 'donut'
            ? 'doughnut'
            : kind;

    const ink =
      getComputedStyle(el).getPropertyValue('--admin-muted')?.trim() ||
      '#94a3b8';
    const grid =
      getComputedStyle(el).getPropertyValue('--admin-line')?.trim() ||
      'rgba(148,163,184,0.25)';

    const ctx = el.getContext('2d');
    const datasets = raw.map((ds, i) => {
      const color = ds.color ?? PALETTE[i % PALETTE.length];
      if (isPie) {
        const sliceColors = labels.map(
          (_, idx) => PALETTE[idx % PALETTE.length],
        );
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: sliceColors,
          hoverBackgroundColor: sliceColors.map((c) => c),
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 6,
        };
      }

      let backgroundColor: string | CanvasGradient = color + '33';
      if (kind === 'area' && ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, this.height());
        g.addColorStop(0, color + '55');
        g.addColorStop(1, color + '05');
        backgroundColor = g;
      } else if (kind === 'bar' || kind === 'horizontalBar') {
        backgroundColor = color;
      }

      return {
        label: ds.label,
        data: ds.data,
        borderColor: color,
        backgroundColor,
        fill: kind === 'area' || ds.fill === true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderRadius: kind === 'bar' || kind === 'horizontalBar' ? 8 : 0,
        maxBarThickness: 28,
      };
    });

    const total = raw[0]?.data?.reduce((a, b) => a + b, 0) ?? 0;
    const centerText =
      this.centerLabel() || (isPie ? String(total) : '');
    const centerSub =
      this.centerSubLabel() ||
      (isPie && total ? this.i18n.translate('admin.dashboard.tier.total') : '');

    const config = {
      type,
      data: {
        labels,
        datasets: datasets as ChartConfiguration['data']['datasets'],
      },
      plugins: isPie ? [donutCenterPlugin] : [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 550, easing: 'easeOutQuart' },
        layout: { padding: { top: 4, bottom: 4, left: 4, right: 4 } },
        indexAxis: kind === 'horizontalBar' ? 'y' : 'x',
        cutout: kind === 'donut' ? '72%' : undefined,
        plugins: {
          adminDonutCenter: isPie
            ? { text: centerText, subtext: centerSub }
            : undefined,
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(30, 36, 51, 0.92)',
            titleFont: { size: 12, weight: '600' },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 10,
            displayColors: true,
            boxPadding: 4,
            callbacks: {
              label(ctx: TooltipItem<ChartType>) {
                const v = ctx.parsed;
                const num =
                  typeof v === 'number'
                    ? v
                    : ((v as { y?: number })?.y ??
                      (v as { r?: number })?.r ??
                      0);
                const label = ctx.label || ctx.dataset.label || '';
                if (isPie && total > 0) {
                  const pct = Math.round((Number(num) / total) * 100);
                  return ` ${label}: ${num} (${pct}%)`;
                }
                return ` ${label}: ${num}`;
              },
            },
          },
        },
        scales: isPie
          ? undefined
          : {
              x: {
                border: { display: false },
                grid: { display: false },
                ticks: {
                  color: ink,
                  font: { size: 11, weight: 500 },
                  maxRotation: 0,
                  padding: 6,
                },
              },
              y: {
                border: { display: false },
                grid: {
                  color: grid,
                  drawTicks: false,
                },
                ticks: {
                  color: ink,
                  font: { size: 11 },
                  padding: 8,
                  precision: 0,
                },
                beginAtZero: true,
              },
            },
      },
    };

    this.chart = new Chart(el, config as unknown as ChartConfiguration);
  }
}
