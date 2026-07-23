import { Routes } from '@angular/router';

export const CYCLE_ROUTES: Routes = [
  {
    path: 'period-date-picker',
    loadComponent: () =>
      import(
        '@app/features/cycle/period-date-picker-page/period-date-picker-page.component'
      ).then((m) => m.PeriodDatePickerPageComponent),
  },
  {
    path: 'period-edit',
    loadComponent: () =>
      import('@app/features/cycle/edit-period/edit-period.component').then(
        (m) => m.EditPeriodComponent,
      ),
  },
  {
    path: 'symptoms-tracker',
    loadComponent: () =>
      import('@app/features/cycle/symptoms-tracker/symptoms-tracker.component').then(
        (m) => m.SymptomsTrackerComponent,
      ),
  },
  {
    path: 'symptoms-detail',
    loadComponent: () =>
      import('@app/features/cycle/symptoms-detail/symptoms-detail.component').then(
        (m) => m.SymptomsDetailComponent,
      ),
  },
  {
    path: 'symptoms-history',
    loadComponent: () =>
      import('@app/features/cycle/symptoms-history/symptoms-history.component').then(
        (m) => m.SymptomsHistoryComponent,
      ),
  },
  {
    path: 'cycle-calendar',
    loadComponent: () =>
      import('@app/features/cycle/cycle-calendar/cycle-calendar.component').then(
        (m) => m.CycleCalendarComponent,
      ),
  },
];
