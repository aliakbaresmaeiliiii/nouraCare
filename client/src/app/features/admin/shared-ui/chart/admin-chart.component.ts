import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables,
} from 'chart.js';

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

@Component({
  selector: 'app-admin-chart',
  standalone: true,
  template: `<canvas #canvas aria-label="Chart"></canvas>`,
  styles: `
    :host {
      display: block;
      position: relative;
      width: 100%;
      min-height: 220px;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `,
})
export class AdminChartComponent implements AfterViewInit, OnDestroy {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  readonly kind = input<AdminChartKind>('line');
  readonly labels = input<string[]>([]);
  readonly datasets = input<
    Array<{ label: string; data: number[]; color?: string; fill?: boolean }>
  >([]);
  readonly height = input(240);

  constructor() {
    effect(() => {
      // Re-render when inputs change after init
      this.kind();
      this.labels();
      this.datasets();
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
    const colors = [
      '#6366f1',
      '#14b8a6',
      '#818cf8',
      '#d97706',
      '#c21e56',
      '#0284c7',
    ];

    const isPie = kind === 'pie' || kind === 'donut';
    const type: ChartType =
      kind === 'horizontalBar' ? 'bar' : kind === 'area' ? 'line' : kind === 'donut' ? 'doughnut' : kind;

    const datasets = this.datasets().map((ds, i) => {
      const color = ds.color ?? colors[i % colors.length];
      if (isPie) {
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: colors.map((c) => c + 'cc'),
          borderWidth: 0,
        };
      }
      return {
        label: ds.label,
        data: ds.data,
        borderColor: color,
        backgroundColor:
          kind === 'area' || kind === 'bar' || kind === 'horizontalBar'
            ? color + (kind === 'area' ? '33' : 'cc')
            : color,
        fill: kind === 'area' || ds.fill === true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: kind === 'line' || kind === 'area' ? 0 : undefined,
        pointHoverRadius: 4,
      };
    });

    const config = {
      type,
      data: {
        labels: this.labels(),
        datasets: datasets as ChartConfiguration['data']['datasets'],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: kind === 'horizontalBar' ? 'y' : 'x',
        plugins: {
          legend: {
            display: isPie || this.datasets().length > 1,
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 11 } },
          },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: isPie
          ? undefined
          : {
              x: {
                grid: { color: 'rgba(148,163,184,0.15)' },
                ticks: { font: { size: 10 }, maxRotation: 0 },
              },
              y: {
                grid: { color: 'rgba(148,163,184,0.15)' },
                ticks: { font: { size: 10 } },
                beginAtZero: true,
              },
            },
        ...(kind === 'donut' ? { cutout: '68%' } : {}),
      },
    } as ChartConfiguration;

    el.parentElement!.style.minHeight = `${this.height()}px`;
    this.chart = new Chart(el, config);
  }
}
