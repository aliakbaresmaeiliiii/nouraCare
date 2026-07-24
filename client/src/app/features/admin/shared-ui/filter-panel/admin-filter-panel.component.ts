import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-filter-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="filters">
      <label>
        <span>From</span>
        <input type="date" [(ngModel)]="from" (ngModelChange)="emit()" />
      </label>
      <label>
        <span>To</span>
        <input type="date" [(ngModel)]="to" (ngModelChange)="emit()" />
      </label>
      <label class="filters__grow">
        <span>Query</span>
        <input
          type="search"
          [(ngModel)]="query"
          (ngModelChange)="emit()"
          placeholder="Filter…"
        />
      </label>
      <button type="button" class="filters__reset" (click)="reset()">Reset</button>
    </div>
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      align-items: end;
      padding: 0.85rem;
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: var(--admin-radius);
    }
    label {
      display: grid;
      gap: 0.25rem;
      font-size: 0.72rem;
      color: var(--admin-muted);
      font-weight: 600;
    }
    .filters__grow { flex: 1; min-width: 160px; }
    input {
      border: 1px solid var(--admin-line);
      border-radius: 0.45rem;
      padding: 0.45rem 0.55rem;
      background: var(--admin-surface-2);
      color: var(--admin-ink);
      font: inherit;
      font-size: 0.86rem;
    }
    .filters__reset {
      border: 1px solid var(--admin-line);
      background: transparent;
      color: var(--admin-ink);
      border-radius: 0.45rem;
      padding: 0.45rem 0.75rem;
      cursor: pointer;
      font: inherit;
      font-size: 0.84rem;
    }
  `,
})
export class AdminFilterPanelComponent {
  readonly from = model('');
  readonly to = model('');
  readonly query = model('');
  readonly changed = output<{ from: string; to: string; query: string }>();

  emit(): void {
    this.changed.emit({ from: this.from(), to: this.to(), query: this.query() });
  }

  reset(): void {
    this.from.set('');
    this.to.set('');
    this.query.set('');
    this.emit();
  }
}
