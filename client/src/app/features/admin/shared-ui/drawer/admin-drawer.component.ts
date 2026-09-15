import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-admin-drawer',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (open()) {
      <div class="drawer-root">
        <div class="drawer-backdrop" (click)="closed.emit()" aria-hidden="true"></div>
        <aside class="drawer" role="dialog" [attr.aria-label]="title()">
          <header class="drawer__head">
            <h2>{{ title() }}</h2>
            <button
              type="button"
              class="drawer__close"
              (click)="closed.emit()"
              [attr.aria-label]="'admin.common.close' | translate"
            >
              ×
            </button>
          </header>
          <div class="drawer__body">
            <ng-content />
          </div>
          @if (hasFooter()) {
            <footer class="drawer__foot">
              <ng-content select="[footer]" />
            </footer>
          }
        </aside>
      </div>
    }
  `,
  styles: `
    .drawer-root { position: fixed; inset: 0; z-index: 60; }
    .drawer-backdrop {
      position: absolute; inset: 0;
      background: rgba(2, 8, 16, 0.4);
      animation: fade 160ms ease;
    }
    .drawer {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      width: min(440px, 100vw);
      background: var(--admin-surface);
      border-inline-start: 1px solid var(--admin-line);
      box-shadow: var(--admin-shadow-lg, var(--admin-shadow));
      display: flex;
      flex-direction: column;
      animation: slide 180ms ease;
    }
    .drawer__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.1rem;
      border-bottom: 1px solid var(--admin-line);
    }
    .drawer__head h2 { margin: 0; font-size: 1rem; }
    .drawer__close {
      border: 0; background: transparent; font-size: 1.4rem;
      cursor: pointer; color: var(--admin-muted); line-height: 1;
    }
    .drawer__body { flex: 1; overflow: auto; padding: 1.1rem; }
    .drawer__foot {
      padding: 0.85rem 1.1rem;
      border-top: 1px solid var(--admin-line);
      display: flex; gap: 0.5rem; justify-content: flex-end;
    }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide { from { transform: translateX(12px); opacity: 0.6; } to { transform: none; opacity: 1; } }
  `,
})
export class AdminDrawerComponent {
  readonly open = input(false);
  readonly title = input('Details');
  readonly hasFooter = input(false);
  readonly closed = output<void>();
}
