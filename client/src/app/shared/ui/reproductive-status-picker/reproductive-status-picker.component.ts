import { Component, input, output } from '@angular/core';
import { addIcons } from 'ionicons';
import { checkmark } from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { REPRODUCTIVE_STATUS_OPTIONS } from '@app/shared/reproductive-status/reproductive-status-options';
import { isReproductiveUiStatusSelected } from '@app/shared/reproductive-status/reproductive-status.mapper';
import type { ReproductiveStatusOption } from '@app/shared/reproductive-status/reproductive-status.model';

addIcons({ checkmark });

/**
 * Reusable «وضعیت شما» 2×2 card picker.
 * Emit {@link statusChange} with the UI key; parent owns API + Home sync.
 */
@Component({
  selector: 'app-reproductive-status-picker',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './reproductive-status-picker.component.html',
  styleUrl: './reproductive-status-picker.component.scss',
})
export class ReproductiveStatusPickerComponent {
  /** Currently selected UI status (e.g. PREGNANT, NOT_PREGNANT). */
  readonly selectedStatus = input<string | null>(null);

  /** Keep «قصد بارداری» highlighted until dashboard reports planning. */
  readonly planningPending = input(false);

  /** Show section title «وضعیت شما». */
  readonly showTitle = input(true);

  readonly titleKey = input('editProfile.experienceTitle');

  readonly disabled = input(false);

  readonly options = input<readonly ReproductiveStatusOption[]>(
    REPRODUCTIVE_STATUS_OPTIONS,
  );

  readonly statusChange = output<string>();

  isSelected(option: ReproductiveStatusOption): boolean {
    return isReproductiveUiStatusSelected(
      this.selectedStatus(),
      option.uiStatus,
      { planningPending: this.planningPending() },
    );
  }

  onSelect(option: ReproductiveStatusOption): void {
    if (this.disabled() || this.isSelected(option)) return;
    this.statusChange.emit(option.uiStatus);
  }
}
