import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  IonIcon,
} from '@ionic/angular/standalone';
import type { InitializeReproductiveStateDto } from '../../services/onboarding.service';
import { CycleSettingsService } from '../../services/cycle-settings.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import {
  buildCycleLmpDatetimeHighlights,
  ionDatetimeTodayHighlight,
  localCalendarIsoDate,
} from '../../utils/ion-datetime-today-highlight.util';
import { normalizeLmpInput } from '../../utils/pregnancy-lmp.util';
import { AppButtonComponent } from '../app-button/app-button.component';

export type PregnancySetupInputMode = 'lmp' | 'week' | 'due';

@Component({
  selector: 'app-pregnancy-setup-sheet',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonDatetime,
    IonInput,
    IonNote,
    AppButtonComponent,
    TranslatePipe,
    IonIcon,
  ],
  templateUrl: './pregnancy-setup-sheet.component.html',
  styleUrls: ['./pregnancy-setup-sheet.component.scss'],
})
export class PregnancySetupSheetComponent {
  private modalCtrl = inject(ModalController);
  private cycleSettings = inject(CycleSettingsService);
  private translation = inject(TranslationService);

  readonly todayStr = localCalendarIsoDate();
  readonly datetimeHighlightedToday = ionDatetimeTodayHighlight();

  get lmpDatetimeHighlights() {
    return buildCycleLmpDatetimeHighlights(
      normalizeLmpInput(this.lmpIso),
      this.cycleSettings.cycleLength() || 28,
      this.cycleSettings.periodLength() || 5,
    );
  }

  mode: PregnancySetupInputMode = 'lmp';
  lmpIso = '';
  dueIso = '';
  weekInput: number | null = null;
  validationMessage = '';

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  submit() {
    this.validationMessage = '';
    const todayStr = localCalendarIsoDate();

    if (this.mode === 'lmp') {
      const raw = (this.lmpIso || '').trim();
      if (!raw) {
        this.validationMessage = this.translation.translate(
          'pregnancySetup.validationLmpRequired',
        );
        return;
      }
      const day = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10);
      if (day > todayStr) {
        this.validationMessage = this.translation.translate(
          'pregnancySetup.validationLmpFuture',
        );
        return;
      }
      const patch: InitializeReproductiveStateDto = {
        state: 'pregnant',
        pregnancyStartDate: day,
      };
      return this.modalCtrl.dismiss(patch, 'confirm');
    }

    if (this.mode === 'week') {
      const w = this.weekInput;
      if (w === null || w === undefined || Number.isNaN(Number(w))) {
        this.validationMessage = this.translation.translate(
          'pregnancySetup.validationWeekRequired',
        );
        return;
      }
      const wi = Math.floor(Number(w));
      if (wi < 0 || wi > 42) {
        this.validationMessage = this.translation.translate(
          'pregnancySetup.validationWeekRange',
        );
        return;
      }
      const patch: InitializeReproductiveStateDto = {
        state: 'pregnant',
        currentWeek: wi,
      };
      return this.modalCtrl.dismiss(patch, 'confirm');
    }

    const due = (this.dueIso || '').trim();
    if (!due) {
      this.validationMessage = this.translation.translate(
        'pregnancySetup.validationDueRequired',
      );
      return;
    }
    const dueDay = due.includes('T') ? due.split('T')[0] : due.slice(0, 10);
    if (dueDay < todayStr) {
      this.validationMessage = this.translation.translate(
        'pregnancySetup.validationDuePast',
      );
      return;
    }
    const patch: InitializeReproductiveStateDto = {
      state: 'pregnant',
      pregnancyDueDate: dueDay,
    };
    return this.modalCtrl.dismiss(patch, 'confirm');
  }
}
