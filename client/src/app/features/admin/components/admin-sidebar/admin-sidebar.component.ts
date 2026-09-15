import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { APP_BRAND } from '@app/shared/constants/app-brand.constants';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { filter, map, startWith } from 'rxjs';
import { ADMIN_NAV_GROUPS } from '../../data/nav.config';
import { AdminNavItem } from '../../data/models/admin.models';
import { AdminShellService } from '../../data/services/admin-shell.service';

const ICON_GLYPHS: Record<string, string> = {
  grid: '▦',
  chart: '◔',
  users: '◎',
  activity: '⌁',
  retain: '↻',
  revenue: '$',
  sub: '★',
  pay: '◎',
  health: '♥',
  status: '●',
  api: '⇄',
  report: '▤',
  ticket: '✉',
  bell: '⚑',
  audit: '☰',
  shield: '⬡',
  plug: '⬡',
  flag: '⚐',
  settings: '⚙',
  doctor: '✚',
  calendar: '▦',
};
function itemContainsPath(item: AdminNavItem, url: string): boolean {
  if (item.path && (url === item.path || url.startsWith(`${item.path}/`))) {
    return true;
  }
  return !!item.children?.some((child) => itemContainsPath(child, url));
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  private readonly shell = inject(AdminShellService);
  private readonly router = inject(Router);

  readonly mobile = input(false);
  readonly closed = output<void>();
  readonly logoPath = APP_BRAND.logoPath;

  readonly groups = ADMIN_NAV_GROUPS;
  readonly collapsed = computed(() =>
    this.mobile() ? false : this.shell.sidebarCollapsed(),
  );

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0]),
      startWith(this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  /** Explicit open/closed overrides keyed by item label. */
  private readonly openState = signal<Record<string, boolean>>({});

  iconGlyph(key: string): string {
    return ICON_GLYPHS[key] ?? '•';
  }

  hasChildren(item: AdminNavItem): boolean {
    return !!item.children?.length;
  }

  isParentActive(item: AdminNavItem): boolean {
    return itemContainsPath(item, this.url());
  }

  isSubmenuOpen(item: AdminNavItem): boolean {
    if (this.collapsed()) return false;
    const override = this.openState()[item.label];
    if (override !== undefined) return override;
    return itemContainsPath(item, this.url());
  }

  toggleSubmenu(item: AdminNavItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.collapsed()) {
      this.shell.toggleSidebar();
      this.openState.update((state) => ({ ...state, [item.label]: true }));
      return;
    }
    const next = !this.isSubmenuOpen(item);
    this.openState.update((state) => ({ ...state, [item.label]: next }));
  }

  onNavigate(): void {
    if (this.mobile()) this.closed.emit();
  }

  toggleCollapse(): void {
    this.shell.toggleSidebar();
  }
}
