import { Component } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class TestComponent {}
