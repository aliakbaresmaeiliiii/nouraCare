import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { ADMIN_NAV_GROUPS } from '../../data/nav.config';
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
  bell: '⚑',
  audit: '☰',
  shield: '⬡',
  plug: '⬡',
  flag: '⚐',
  settings: '⚙',
};

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  private readonly shell = inject(AdminShellService);

  readonly mobile = input(false);
  readonly closed = output<void>();

  readonly groups = ADMIN_NAV_GROUPS;
  readonly collapsed = computed(() =>
    this.mobile() ? false : this.shell.sidebarCollapsed(),
  );

  iconGlyph(key: string): string {
    return ICON_GLYPHS[key] ?? '•';
  }

  onNavigate(): void {
    if (this.mobile()) this.closed.emit();
  }

  toggleCollapse(): void {
    this.shell.toggleSidebar();
  }
}
