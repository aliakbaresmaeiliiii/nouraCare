import { Component, inject } from '@angular/core';
import { AdminToastService } from '../../data/services/admin-toast.service';

@Component({
  selector: 'app-admin-toast-host',
  standalone: true,
  template: `
    <div class="toast-host" aria-live="polite">
      @for (t of toastSvc.toasts(); track t.id) {
        <div class="toast" [attr.data-tone]="t.tone" (click)="toastSvc.dismiss(t.id)">
          {{ t.message }}
        </div>
      }
    </div>
  `,
  styles: `
    .toast-host {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 80;
      display: grid;
      gap: 0.5rem;
      width: min(360px, calc(100vw - 2rem));
    }
    .toast {
      padding: 0.75rem 0.9rem;
      border-radius: 0.65rem;
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      box-shadow: var(--admin-shadow);
      color: var(--admin-ink);
      font-size: 0.86rem;
      cursor: pointer;
      animation: toast-in 180ms ease;
    }
    .toast[data-tone='success'] { border-color: color-mix(in srgb, var(--admin-success) 45%, var(--admin-line)); }
    .toast[data-tone='warning'] { border-color: color-mix(in srgb, var(--admin-warning) 45%, var(--admin-line)); }
    .toast[data-tone='danger'] { border-color: color-mix(in srgb, var(--admin-danger) 45%, var(--admin-line)); }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
  `,
})
export class AdminToastHostComponent {
  readonly toastSvc = inject(AdminToastService);
}
