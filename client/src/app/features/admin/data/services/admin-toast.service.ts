import { Injectable, signal } from '@angular/core';

export interface AdminToast {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class AdminToastService {
  private seq = 0;
  readonly toasts = signal<AdminToast[]>([]);

  show(message: string, tone: AdminToast['tone'] = 'info', ms = 3200): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, message, tone }]);
    window.setTimeout(() => this.dismiss(id), ms);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
