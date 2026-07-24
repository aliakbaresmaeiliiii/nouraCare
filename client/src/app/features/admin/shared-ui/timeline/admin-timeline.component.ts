import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';

export interface AdminTimelineItem {
  id: string;
  title: string;
  detail?: string;
  at: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'app-admin-timeline',
  standalone: true,
  imports: [DatePipe],
  template: `
    <ol class="tl">
      @for (item of items(); track item.id) {
        <li [attr.data-tone]="item.tone || 'info'">
          <div class="tl__dot" aria-hidden="true"></div>
          <div class="tl__body">
            <div class="tl__title">{{ item.title }}</div>
            @if (item.detail) {
              <div class="tl__detail">{{ item.detail }}</div>
            }
            <time>{{ item.at | date: 'MMM d, y · HH:mm' }}</time>
          </div>
        </li>
      }
    </ol>
  `,
  styles: `
    .tl {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0;
    }
    li {
      display: grid;
      grid-template-columns: 1.25rem 1fr;
      gap: 0.75rem;
      position: relative;
      padding-bottom: 1rem;
    }
    li:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 0.5rem;
      top: 1rem;
      bottom: 0;
      width: 2px;
      background: var(--admin-line);
    }
    .tl__dot {
      width: 0.7rem;
      height: 0.7rem;
      margin-top: 0.25rem;
      border-radius: 999px;
      background: var(--admin-accent);
      justify-self: center;
    }
    li[data-tone='success'] .tl__dot { background: var(--admin-success); }
    li[data-tone='warning'] .tl__dot { background: var(--admin-warning); }
    li[data-tone='danger'] .tl__dot { background: var(--admin-danger); }
    .tl__title { font-weight: 600; font-size: 0.88rem; }
    .tl__detail { color: var(--admin-muted); font-size: 0.8rem; margin-top: 0.15rem; }
    time { display: block; margin-top: 0.25rem; font-size: 0.72rem; color: var(--admin-muted); }
  `,
})
export class AdminTimelineComponent {
  readonly items = input<AdminTimelineItem[]>([]);
}
