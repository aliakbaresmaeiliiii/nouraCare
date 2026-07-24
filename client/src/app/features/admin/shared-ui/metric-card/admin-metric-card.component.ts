import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-metric-card',
  standalone: true,
  template: `
    <article class="metric">
      <div class="metric__row">
        <span class="metric__label">{{ label() }}</span>
        @if (badge()) {
          <span class="metric__badge">{{ badge() }}</span>
        }
      </div>
      <div class="metric__value">{{ value() }}</div>
      @if (sub()) {
        <div class="metric__sub">{{ sub() }}</div>
      }
    </article>
  `,
  styles: `
    .metric {
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: var(--admin-radius);
      padding: 0.95rem 1rem;
      box-shadow: var(--admin-shadow);
    }
    .metric__row {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      align-items: center;
    }
    .metric__label { color: var(--admin-muted); font-size: 0.78rem; font-weight: 550; }
    .metric__badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: var(--admin-accent-soft);
      color: var(--admin-accent);
    }
    .metric__value {
      margin-top: 0.35rem;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .metric__sub { margin-top: 0.25rem; color: var(--admin-muted); font-size: 0.75rem; }
  `,
})
export class AdminMetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly sub = input<string>('');
  readonly badge = input<string>('');
}
