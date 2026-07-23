import { Component, inject, OnInit, signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { ionDatetimeTodayHighlight } from '@app/shared/utils/ion-datetime-today-highlight.util';
import { form } from '@angular/forms/signals';

interface pregnancyForm {
  pregnancyEndDate: string;
  notes: string;
}
@Component({
  selector: 'app-pregnancy-end-dialog',
  templateUrl: './pregnancy-end-dialog.component.html',
  styleUrls: ['./pregnancy-end-dialog.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class PregnancyEndDialogComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  maxDate = new Date().toISOString().split('T')[0];

  pregnancyFormModel = signal<pregnancyForm>({
    pregnancyEndDate: '',
    notes: '',
  });

  pregnancyForm = form(this.pregnancyFormModel);

  readonly datetimeHighlightedToday = ionDatetimeTodayHighlight();

  notes: string = '';

  ngOnInit(): void {
    this.maxDate = new Date().toISOString().split('T')[0];
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(event: Event) {
    event.preventDefault();
    const credentials = this.pregnancyFormModel();

    if (credentials) {
      this.modalCtrl.dismiss(credentials, 'confirm');
    }
  }

  get pregnancyEndDate() {
    return !!this.toDateOnly(this.pregnancyForm().value ?? '').trim();
  }

  private toDateOnly(value: unknown): string {
    const s = String(value ?? '').trim();
    if (!s || s === 'null' || s === 'undefined') return '';
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m?.[1]) return m[1];
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
