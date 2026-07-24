import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-admin-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="dlg-root" role="presentation">
        <div class="dlg-backdrop" (click)="closed.emit()" aria-hidden="true"></div>
        <div class="dlg" role="dialog" [attr.aria-label]="title()">
          <header>
            <h2>{{ title() }}</h2>
            <button type="button" (click)="closed.emit()" aria-label="Close">×</button>
          </header>
          <div class="dlg__body"><ng-content /></div>
          <footer>
            <ng-content select="[footer]" />
          </footer>
        </div>
      </div>
    }
  `,
  styles: `
    .dlg-root { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 1rem; }
    .dlg-backdrop { position: absolute; inset: 0; background: rgba(2, 8, 16, 0.45); }
    .dlg {
      position: relative;
      width: min(480px, 100%);
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: var(--admin-radius);
      box-shadow: var(--admin-shadow);
      animation: pop 160ms ease;
    }
    header, footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.9rem 1rem; gap: 0.75rem;
    }
    header { border-bottom: 1px solid var(--admin-line); }
    footer { border-top: 1px solid var(--admin-line); justify-content: flex-end; }
    header h2 { margin: 0; font-size: 1rem; }
    header button {
      border: 0; background: transparent; font-size: 1.35rem;
      cursor: pointer; color: var(--admin-muted);
    }
    .dlg__body { padding: 1rem; }
    @keyframes pop { from { transform: scale(0.98); opacity: 0; } to { transform: none; opacity: 1; } }
  `,
})
export class AdminDialogComponent {
  readonly open = input(false);
  readonly title = input('Dialog');
  readonly closed = output<void>();
}
