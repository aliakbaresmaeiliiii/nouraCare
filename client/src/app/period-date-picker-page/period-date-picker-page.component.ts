import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import {
  PeriodDatePickerComponent,
  PeriodDateRange,
} from '../shared/components/period-date-picker/period-date-picker.component';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { PeriodHistoryService } from '../shared/services/period-history.service';

@Component({
  selector: 'app-period-date-picker-page',
  templateUrl: './period-date-picker-page.component.html',
  styleUrls: ['./period-date-picker-page.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, PeriodDatePickerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PeriodDatePickerPageComponent implements OnInit {
  constructor() {
    addIcons({ closeOutline });
  }

  /** Set when opened as a modal (e.g. from home) */
  @Input() initialStartIso: string | null = null;

  periodLength = 5;
  selectedRange: PeriodDateRange | null = null;

  private modalController = inject(ModalController);
  private router = inject(Router);
  private location = inject(Location);
  private cycleSettings = inject(CycleSettingsService);
  private periodHistory = inject(PeriodHistoryService);

  ngOnInit() {
    this.periodLength = this.cycleSettings.periodLength();
    this.initialStartIso =
      this.initialStartIso ?? this.cycleSettings.lastPeriodStartDate();
  }

  onRangeSelected(range: PeriodDateRange) {
    this.selectedRange = range;
  }

  async savePeriod() {
    if (!this.selectedRange?.startDate) return;

    const onPickerRoute = this.router.url.split('?')[0].includes('/period-date-picker');
    if (!onPickerRoute) {
      await this.modalController.dismiss(this.selectedRange);
      return;
    }

    const iso = this.selectedRange.startDate.toISOString().split('T')[0];
    this.cycleSettings.setLastPeriodStart(iso);
    this.cycleSettings.setUserStatus('Trying to Conceive');
    this.cycleSettings.setPregnancyStatus(false);
    this.cycleSettings.setPostpartumStatus(false);
    this.periodHistory.addEntry(iso);
    await this.router.navigate(['/cycle-calendar']);
  }

  async cancel() {
    const onPickerRoute = this.router.url.split('?')[0].includes('/period-date-picker');
    if (!onPickerRoute) {
      await this.modalController.dismiss();
      return;
    }
    this.location.back();
  }
}
