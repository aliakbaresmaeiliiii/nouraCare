import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';

@Component({
  selector: 'app-data-usage',
  templateUrl: './data-usage.component.html',
  styleUrls: ['./data-usage.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class DataUsageComponent implements OnInit {
  private readonly router = inject(Router);

  autoSyncEnabled = false;

  ngOnInit(): void {
    const saved = localStorage.getItem('autoSync');
    this.autoSyncEnabled = saved === null ? true : saved === 'true';
  }

  goBack(): void {
    void this.router.navigate(['/settings']);
  }
}
