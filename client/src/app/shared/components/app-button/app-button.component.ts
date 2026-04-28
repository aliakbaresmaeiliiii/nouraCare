import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IonButton, IonSpinner],
  templateUrl: './app-button.component.html',
  styleUrl: './app-button.component.scss',
})
export class AppButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly expand = input<'block' | 'full' | undefined>('block');
  readonly fill = input<'clear' | 'outline' | 'solid'>('solid');
  readonly color = input('primary');
  readonly size = input<'small' | 'default' | 'large'>('default');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly ariaLabel = input<string | null>(null);

  readonly buttonClick = output<Event>();

  onClick(event: Event): void {
    this.buttonClick.emit(event);
  }
}
