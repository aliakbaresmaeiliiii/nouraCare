import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TranslationService } from '@app/shared/services/translation.service';
import { AdminToastService } from '../../data/services/admin-toast.service';
import { AdminStubPageComponent } from '../../shared-ui/stub-page/admin-stub-page.component';
import { downloadCsv } from '../../shared-ui/utils/csv.util';

@Component({
  selector: 'app-admin-reports-page',
  standalone: true,
  imports: [AdminStubPageComponent, TranslatePipe],
  templateUrl: './admin-reports.page.html',
  styleUrl: './admin-reports.page.scss',
})
export class AdminReportsPage {
  private readonly toast = inject(AdminToastService);
  private readonly i18n = inject(TranslationService);

  exportCsv(): void {
    downloadCsv(
      'dore-report',
      [
        this.i18n.translate('admin.users.col.name'),
        this.i18n.translate('admin.common.exportCsv'),
      ],
      [
        [this.i18n.translate('admin.nav.users'), 128420],
        [this.i18n.translate('admin.nav.revenue'), 186400],
        [this.i18n.translate('admin.nav.retention'), '42.6%'],
        [this.i18n.translate('admin.nav.sessions'), 21440],
      ],
    );
    this.toast.show(this.i18n.translate('admin.common.exportCsv'), 'success');
  }

  pdf(): void {
    this.toast.show(this.i18n.translate('admin.common.exportPdf'), 'info');
  }
}
