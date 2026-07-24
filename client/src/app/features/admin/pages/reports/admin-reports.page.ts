import { Component, inject } from '@angular/core';
import { AdminStubPageComponent } from '../../shared-ui/stub-page/admin-stub-page.component';
import { AdminToastService } from '../../data/services/admin-toast.service';
import { downloadCsv } from '../../shared-ui/utils/csv.util';

@Component({
  selector: 'app-admin-reports-page',
  standalone: true,
  imports: [AdminStubPageComponent],
  templateUrl: './admin-reports.page.html',
  styleUrl: './admin-reports.page.scss',
})
export class AdminReportsPage {
  private readonly toast = inject(AdminToastService);

  exportCsv(): void {
    downloadCsv(
      'dore-report',
      ['Metric', 'Value'],
      [
        ['Total Users', 128420],
        ['Revenue', 186400],
        ['Retention', '42.6%'],
        ['Sessions', 21440],
      ],
    );
    this.toast.show('Report CSV downloaded', 'success');
  }

  pdf(): void {
    this.toast.show('PDF export scheduled', 'info');
  }
}
