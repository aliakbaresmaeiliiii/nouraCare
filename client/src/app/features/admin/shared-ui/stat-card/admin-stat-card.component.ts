import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-stat-card',
  standalone: true,
  template: `
    <article class="stat" [attr.data-tone]="tone()">
      <div class="stat__label">{{ label() }}</div>
      <div class="stat__value">{{ value() }}</div>
      @if (delta() !== undefined) {
        <div
          class="stat__delta"
          [class.stat__delta--up]="(delta() ?? 0) > 0"
          [class.stat__delta--down]="(delta() ?? 0) < 0"
        >
          {{ (delta() ?? 0) > 0 ? '+' : '' }}{{ delta() }}{{ deltaLabel() || '%' }}
        </div>
      }
      @if (hint()) {
        <div class="stat__hint">{{ hint() }}</div>
      }
    </article>
  `,
  styles: `
    .stat {
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: var(--admin-radius);
      box-shadow: var(--admin-shadow);
      padding: 1rem 1.05rem;
      min-height: 6.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      transition: transform 160ms ease, border-color 160ms ease;
    }
    .stat:hover {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--admin-accent) 35%, var(--admin-line));
    }
    .stat__label {
      color: var(--admin-muted);
      font-size: 0.78rem;
      font-weight: 550;
    }
    .stat__value {
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }
    .stat__delta {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--admin-muted);
    }
    .stat__delta--up { color: var(--admin-success); }
    .stat__delta--down { color: var(--admin-danger); }
    .stat__hint {
      margin-top: auto;
      font-size: 0.72rem;
      color: var(--admin-muted);
    }
    .stat[data-tone='success'] { border-top: 3px solid var(--admin-success); }
    .stat[data-tone='warning'] { border-top: 3px solid var(--admin-warning); }
    .stat[data-tone='danger'] { border-top: 3px solid var(--admin-danger); }
    .stat[data-tone='info'] { border-top: 3px solid var(--admin-info); }
  `,
})
export class AdminStatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly delta = input<number | undefined>(undefined);
  readonly deltaLabel = input<string>('');
  readonly hint = input<string>('');
  readonly tone = input<'default' | 'success' | 'warning' | 'danger' | 'info'>('default');
}
