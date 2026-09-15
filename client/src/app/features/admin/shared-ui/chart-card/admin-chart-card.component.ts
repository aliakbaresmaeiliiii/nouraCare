import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { AdminChartComponent, AdminChartKind } from '../chart/admin-chart.component';

/** Brand-aligned chart colors — indigo → teal → sky. */
const PALETTE = [
  '#6366f1',
  '#14b8a6',
  '#818cf8',
  '#0d9488',
  '#4f46e5',
  '#60a5fa',
];

@Component({
  selector: 'app-admin-chart-card',
  standalone: true,
  imports: [AdminChartComponent, TranslatePipe],
  template: `
    <section class="card" [class.card--split]="kind() === 'donut' || kind() === 'pie'">
      <header class="card__head">
        <div>
          <h3>{{ title() }}</h3>
          @if (subtitle()) {
            <p>{{ subtitle() }}</p>
          }
        </div>
        <div class="card__actions">
          <ng-content select="[actions]" />
        </div>
      </header>

      <div class="card__content">
        <div class="card__chart">
          @if (hasData()) {
            <app-admin-chart
              [kind]="kind()"
              [labels]="labels()"
              [datasets]="datasets()"
              [height]="height()"
              [centerLabel]="centerLabel()"
              [centerSubLabel]="centerSubLabel()"
            />
          } @else {
            <div class="card__empty">
              {{ emptyText() || ('admin.common.noData' | translate) }}
            </div>
          }
        </div>

        @if ((kind() === 'donut' || kind() === 'pie') && hasData()) {
          <ul class="card__legend">
            @for (item of legendItems(); track item.label) {
              <li>
                <span class="swatch" [style.background]="item.color"></span>
                <div class="meta">
                  <strong>{{ item.label }}</strong>
                  <small>{{ item.value }} · {{ item.pct }}%</small>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
  styles: `
    .card {
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: var(--admin-radius);
      box-shadow: var(--admin-shadow);
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: box-shadow 160ms ease, border-color 160ms ease;
    }
    .card:hover {
      border-color: color-mix(in srgb, var(--admin-accent) 22%, var(--admin-line));
      box-shadow: var(--admin-shadow-lg);
    }
    .card__head {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      padding: 1.15rem 1.25rem 0.35rem;
    }
    .card__head h3 {
      margin: 0;
      font-size: 0.98rem;
      font-weight: 750;
      letter-spacing: -0.02em;
    }
    .card__head p {
      margin: 0.25rem 0 0;
      color: var(--admin-muted);
      font-size: 0.78rem;
    }
    .card__content {
      display: grid;
      gap: 0.5rem;
      padding: 0.15rem 0.85rem 1.1rem;
      flex: 1;
      min-height: 0;
    }
    .card--split .card__content {
      grid-template-columns: minmax(0, 1.15fr) minmax(140px, 0.85fr);
      align-items: center;
      gap: 0.75rem 1rem;
      padding-inline: 1rem 1.15rem;
    }
    .card__chart {
      min-height: 0;
    }
    .card__empty {
      min-height: 220px;
      display: grid;
      place-items: center;
      color: var(--admin-muted);
      font-size: 0.88rem;
      background:
        radial-gradient(circle at 50% 50%, var(--admin-accent-soft), transparent 60%);
      border-radius: var(--admin-radius-sm);
    }
    .card__legend {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.55rem;
    }
    .card__legend li {
      display: flex;
      gap: 0.65rem;
      align-items: center;
      padding: 0.55rem 0.65rem;
      border-radius: 0.75rem;
      background: var(--admin-surface-2);
    }
    .swatch {
      width: 0.65rem;
      height: 0.65rem;
      border-radius: 999px;
      flex: 0 0 auto;
    }
    .meta {
      min-width: 0;
      display: grid;
      gap: 0.1rem;
    }
    .meta strong {
      font-size: 0.82rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .meta small {
      color: var(--admin-muted);
      font-size: 0.72rem;
      font-weight: 550;
    }
    @media (max-width: 720px) {
      .card--split .card__content {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AdminChartCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly kind = input<AdminChartKind>('line');
  readonly labels = input<string[]>([]);
  readonly datasets = input<
    Array<{ label: string; data: number[]; color?: string; fill?: boolean }>
  >([]);
  readonly height = input(240);
  readonly centerLabel = input('');
  readonly centerSubLabel = input('');
  readonly emptyText = input('');

  readonly hasData = computed(() => {
    const data = this.datasets()[0]?.data ?? [];
    return data.length > 0;
  });

  readonly legendItems = computed(() => {
    const labels = this.labels();
    const values = this.datasets()[0]?.data ?? [];
    const total = values.reduce((a, b) => a + Number(b), 0) || 1;
    return labels.map((label, i) => {
      const value = Number(values[i] ?? 0);
      return {
        label,
        value,
        pct: Math.round((value / total) * 100),
        color: PALETTE[i % PALETTE.length],
      };
    });
  });
}
