import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-trend-card',
  standalone: true,
  template: `
    <article class="trend">
      <div class="trend__label">{{ label() }}</div>
      <div class="trend__value">{{ value() }}</div>
      <div class="trend__bar" aria-hidden="true">
        <span [style.width.%]="Math.min(100, Math.max(0, progress()))"></span>
      </div>
      <div class="trend__caption">{{ caption() }}</div>
    </article>
  `,
  styles: `
    .trend {
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: var(--admin-radius);
      padding: 0.95rem 1rem;
      box-shadow: var(--admin-shadow);
    }
    .trend__label { color: var(--admin-muted); font-size: 0.78rem; font-weight: 550; }
    .trend__value { margin-top: 0.25rem; font-size: 1.2rem; font-weight: 700; }
    .trend__bar {
      margin-top: 0.65rem;
      height: 0.35rem;
      border-radius: 999px;
      background: var(--admin-surface-2);
      overflow: hidden;
    }
    .trend__bar span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--admin-accent), var(--admin-accent-hover));
    }
    .trend__caption { margin-top: 0.4rem; font-size: 0.72rem; color: var(--admin-muted); }
  `,
})
export class AdminTrendCardComponent {
  readonly Math = Math;
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly progress = input(50);
  readonly caption = input('');
}
