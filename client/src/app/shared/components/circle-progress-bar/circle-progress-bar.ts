import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'app-circle-progress-bar',
  imports: [],
  templateUrl: './circle-progress-bar.html',
  styleUrl: './circle-progress-bar.scss',
})
export class CircleProgressBar implements OnInit {
  cssprop = 'circular-chart nill';
  strokes = '0 ,100';

  value = input<number>(0);

  ngOnInit(): void {
    const val = Number(this.value());
    if (val > 0 && val <= 50) {
      this.cssprop = 'circular-chart red';
    } else if (val > 50 && val < 80) {
      this.cssprop = 'circular-chart yellow';
    } else if (val >= 80) {
      this.cssprop = 'circular-chart green';
    } else {
      this.cssprop = 'circular-chart nill';
    }
    const percent = (val / 100) * 100;
    this.strokes = `${percent}, 100`;
  }
}
