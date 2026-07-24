import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../components/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../components/admin-topbar/admin-topbar.component';
import { AdminFooterComponent } from '../components/admin-footer/admin-footer.component';
import { AdminToastHostComponent } from '../components/admin-toast-host/admin-toast-host.component';
import { AdminShellService } from '../data/services/admin-shell.service';
import { AdminThemeService } from '../data/services/admin-theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    AdminSidebarComponent,
    AdminTopbarComponent,
    AdminFooterComponent,
    AdminToastHostComponent,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  readonly shell = inject(AdminShellService);
  readonly themeSvc = inject(AdminThemeService);
}
