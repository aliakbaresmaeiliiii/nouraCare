import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChild,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { downloadCsv } from '../utils/csv.util';

export interface AdminTableColumn<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  width?: string;
}

@Component({
  selector: 'app-admin-data-table',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './admin-data-table.component.html',
  styleUrl: './admin-data-table.component.scss',
})
export class AdminDataTableComponent<T extends { id: string }> {
  readonly columns = input.required<AdminTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly pageSize = input(10);
  readonly exportName = input('export');
  readonly searchableKeys = input<(keyof T & string)[]>([]);

  readonly rowClick = output<T>();
  readonly bulkAction = output<{ action: string; ids: string[] }>();

  readonly cellTpl = contentChild<TemplateRef<unknown>>('cell');

  readonly search = signal('');
  readonly sortKey = signal<string>('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal(1);
  readonly selected = signal<Set<string>>(new Set());
  readonly statusFilter = signal('');

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const keys = this.searchableKeys();
    let list = [...this.rows()];

    const status = this.statusFilter();
    if (status) {
      list = list.filter((r) => String((r as Record<string, unknown>)['status'] ?? '') === status);
    }

    if (q && keys.length) {
      list = list.filter((row) =>
        keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
      );
    }

    const key = this.sortKey();
    if (key) {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        const av = String((a as Record<string, unknown>)[key] ?? '');
        const bv = String((b as Record<string, unknown>)[key] ?? '');
        return av.localeCompare(bv) * dir;
      });
    }
    return list;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
  );

  readonly pageRows = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    const start = (p - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  readonly allPageSelected = computed(() => {
    const rows = this.pageRows();
    if (!rows.length) return false;
    const sel = this.selected();
    return rows.every((r) => sel.has(r.id));
  });

  setSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  toggleAll(): void {
    const rows = this.pageRows();
    this.selected.update((set) => {
      const next = new Set(set);
      if (this.allPageSelected()) {
        rows.forEach((r) => next.delete(r.id));
      } else {
        rows.forEach((r) => next.add(r.id));
      }
      return next;
    });
  }

  toggleOne(id: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  prev(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  next(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  exportCsv(): void {
    const cols = this.columns();
    downloadCsv(
      this.exportName(),
      cols.map((c) => c.label),
      this.filtered().map((row) =>
        cols.map((c) => String((row as Record<string, unknown>)[c.key] ?? '')),
      ),
    );
  }

  runBulk(action: string): void {
    this.bulkAction.emit({ action, ids: [...this.selected()] });
  }

  cellValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }
}
