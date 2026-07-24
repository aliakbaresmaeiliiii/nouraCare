import { Component, input } from '@angular/core';
import { AdminChartComponent, AdminChartKind } from '../chart/admin-chart.component';

@Component({
  selector: 'app-admin-chart-card',
  standalone: true,
  imports: [AdminChartComponent],
  template: `
    <section class="card">
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
      <div class="card__body">
        <app-admin-chart
          [kind]="kind()"
          [labels]="labels()"
          [datasets]="datasets()"
          [height]="height()"
        />
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
    }
    .card__head {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem 1.1rem 0.35rem;
    }
    .card__head h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 650;
      letter-spacing: -0.02em;
    }
    .card__head p {
      margin: 0.2rem 0 0;
      color: var(--admin-muted);
      font-size: 0.78rem;
    }
    .card__body {
      padding: 0.25rem 0.75rem 0.85rem;
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
}
