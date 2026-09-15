import { Component, input } from '@angular/core';

export type AdminStatIcon =
  | 'users'
  | 'active'
  | 'calendar'
  | 'spark'
  | 'shield'
  | 'warning'
  | 'doctor'
  | 'appointments'
  | 'forum'
  | 'posts'
  | 'premium'
  | 'trial'
  | 'verified'
  | 'default';

@Component({
  selector: 'app-admin-stat-card',
  standalone: true,
  template: `
    <article class="stat" [attr.data-tone]="tone()" [attr.data-icon]="icon()">
      <div class="stat__top">
        <div class="stat__copy">
          <div class="stat__label">{{ label() }}</div>
          <div class="stat__value">{{ value() }}</div>
        </div>
        <span class="stat__icon" aria-hidden="true">
          @switch (icon()) {
            @case ('users') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" stroke-width="1.8"/>
                <path d="M8 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" stroke-width="1.8" opacity=".55"/>
                <path d="M16.2 14c-2.7 0-5 1.7-5.7 4.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M8.1 14.4c-2.5.2-4.6 1.7-5.3 3.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>
              </svg>
            }
            @case ('active') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" stroke="currentColor" stroke-width="1.8"/>
                <path d="M8.5 12.2 11 14.7 15.8 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            }
            @case ('calendar') {
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" stroke-width="1.8"/>
                <path d="M8 3.5v3M16 3.5v3M3.5 10h17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            }
            @case ('spark') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3.5 13.7 9.2 19.5 11 13.7 12.8 12 18.5 10.3 12.8 4.5 11 10.3 9.2 12 3.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
              </svg>
            }
            @case ('shield') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3.5 19 6.5v5.2c0 4.4-2.9 7.5-7 9.3-4.1-1.8-7-4.9-7-9.3V6.5L12 3.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            }
            @case ('warning') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 4.2 20.5 19H3.5L12 4.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M12 10v4.2M12 16.8h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            }
            @case ('doctor') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" stroke-width="1.8"/>
                <path d="M5.5 19.5c.8-3 3.2-4.5 6.5-4.5s5.7 1.5 6.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M18 8.5v4M16 10.5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            }
            @case ('appointments') {
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" stroke-width="1.8"/>
                <path d="M8 3.5v3M16 3.5v3M3.5 10h17M9.5 14h5M12 14v3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            }
            @case ('forum') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 17.5 4.5 20l.8-3.2A7.5 7.5 0 1 1 12 19.5a7.4 7.4 0 0 1-3.6-.9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            }
            @case ('posts') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 4.5h10a2 2 0 0 1 2 2v11l-4-2.5H7a2 2 0 0 1-2-2v-6.5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M9 9h6M9 12.5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            }
            @case ('premium') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m5 16 2.5-8.5L12 12l4.5-4.5L19 16H5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M5 16h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            }
            @case ('trial') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M8 4.5h8M9.5 4.5v2.2a6.5 6.5 0 0 0 5 0V4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M8.2 10.5h7.6L17 19.5H7l1.2-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            }
            @case ('verified') {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3.8 14.1 5l2.4.2.8 2.3 2 1.3-.6 2.4.6 2.4-2 1.3-.8 2.3-2.4.2L12 20.2 9.9 19l-2.4-.2-.8-2.3-2-1.3.6-2.4-.6-2.4 2-1.3.8-2.3 2.4-.2L12 3.8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                <path d="m9.2 12 1.9 1.9 3.7-3.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            }
            @default {
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            }
          }
        </span>
      </div>

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
      position: relative;
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: var(--admin-radius);
      box-shadow: var(--admin-shadow);
      padding: 1.05rem 1.1rem;
      min-height: 6.4rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      overflow: hidden;
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }
    .stat:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--admin-accent) 28%, var(--admin-line));
      box-shadow: var(--admin-shadow-lg);
    }
    .stat__top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .stat__copy {
      min-width: 0;
      display: grid;
      gap: 0.35rem;
    }
    .stat__label {
      color: var(--admin-muted);
      font-size: 0.8rem;
      font-weight: 600;
    }
    .stat__value {
      font-size: 1.55rem;
      font-weight: 750;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }
    .stat__icon {
      width: 2.55rem;
      height: 2.55rem;
      border-radius: 0.9rem;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      background: var(--admin-accent-soft);
      color: var(--admin-accent);
    }
    .stat__icon svg {
      width: 1.2rem;
      height: 1.2rem;
    }
    .stat[data-tone='success'] .stat__icon {
      background: color-mix(in srgb, var(--admin-success) 16%, transparent);
      color: var(--admin-success);
    }
    .stat[data-tone='warning'] .stat__icon {
      background: color-mix(in srgb, var(--admin-warning) 16%, transparent);
      color: var(--admin-warning);
    }
    .stat[data-tone='danger'] .stat__icon {
      background: color-mix(in srgb, var(--admin-danger) 16%, transparent);
      color: var(--admin-danger);
    }
    .stat[data-tone='info'] .stat__icon {
      background: color-mix(in srgb, var(--admin-info) 16%, transparent);
      color: var(--admin-info);
    }
    .stat__delta {
      font-size: 0.78rem;
      font-weight: 650;
      color: var(--admin-muted);
    }
    .stat__delta--up { color: var(--admin-success); }
    .stat__delta--down { color: var(--admin-danger); }
    .stat__hint {
      margin-top: auto;
      font-size: 0.72rem;
      color: var(--admin-muted);
    }
  `,
})
export class AdminStatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly delta = input<number | undefined>(undefined);
  readonly deltaLabel = input<string>('');
  readonly hint = input<string>('');
  readonly tone = input<'default' | 'success' | 'warning' | 'danger' | 'info'>('default');
  readonly icon = input<AdminStatIcon>('default');
}
