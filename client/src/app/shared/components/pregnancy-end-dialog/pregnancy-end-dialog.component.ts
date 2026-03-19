import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';

@Component({
  selector: 'app-pregnancy-end-dialog',
  templateUrl: './pregnancy-end-dialog.component.html',
  styleUrls: ['./pregnancy-end-dialog.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS]
})
export class PregnancyEndDialogComponent {
  private modalCtrl = inject(ModalController);
  
  pregnancyEndDate: string = '';
  notes: string = '';

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (this.pregnancyEndDate) {
      this.modalCtrl.dismiss({
        pregnancyEndDate: this.pregnancyEndDate,
        notes: this.notes
      }, 'confirm');
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTodayDate(): string {
    return new Date().toISOString();
  }
}
