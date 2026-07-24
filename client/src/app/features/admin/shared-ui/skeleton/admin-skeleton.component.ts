import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-skeleton',
  standalone: true,
  template: `
    <div class="sk" [style.height]="height()" [style.width]="width()" aria-hidden="true"></div>
  `,
  styles: `
    .sk {
      border-radius: 0.55rem;
      background: linear-gradient(
        90deg,
        var(--admin-surface-2),
        color-mix(in srgb, var(--admin-line) 65%, var(--admin-surface)),
        var(--admin-surface-2)
      );
      background-size: 200% 100%;
      animation: shimmer 1.2s ease infinite;
    }
    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
  `,
})
export class AdminSkeletonComponent {
  readonly height = input('1rem');
  readonly width = input('100%');
}
