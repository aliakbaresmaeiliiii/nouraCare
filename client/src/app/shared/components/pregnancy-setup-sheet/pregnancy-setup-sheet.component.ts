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
} from '@ionic/angular/standalone';
import type { InitializeReproductiveStateDto } from '../../services/onboarding.service';

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
  ],
  templateUrl: './pregnancy-setup-sheet.component.html',
  styleUrls: ['./pregnancy-setup-sheet.component.scss'],
})
export class PregnancySetupSheetComponent {
  private modalCtrl = inject(ModalController);

  readonly todayStr = new Date().toISOString().split('T')[0];

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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (this.mode === 'lmp') {
      const raw = (this.lmpIso || '').trim();
      if (!raw) {
        this.validationMessage = 'Please choose your last period start date (LMP).';
        return;
      }
      const day = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10);
      if (day > todayStr) {
        this.validationMessage = 'LMP cannot be in the future.';
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
        this.validationMessage = 'Please enter how many full weeks you are along (0–42).';
        return;
      }
      const wi = Math.floor(Number(w));
      if (wi < 0 || wi > 42) {
        this.validationMessage = 'Week must be between 0 and 42.';
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
      this.validationMessage = 'Please choose your estimated due date.';
      return;
    }
    const dueDay = due.includes('T') ? due.split('T')[0] : due.slice(0, 10);
    if (dueDay < todayStr) {
      this.validationMessage = 'Due date cannot be in the past.';
      return;
    }
    const patch: InitializeReproductiveStateDto = {
      state: 'pregnant',
      pregnancyDueDate: dueDay,
    };
    return this.modalCtrl.dismiss(patch, 'confirm');
  }
}
