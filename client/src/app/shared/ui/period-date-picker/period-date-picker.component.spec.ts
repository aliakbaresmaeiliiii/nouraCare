import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PeriodDatePickerComponent } from '@app/shared/ui/period-date-picker/period-date-picker.component';

describe('PeriodDatePickerComponent', () => {
  let component: PeriodDatePickerComponent;
  let fixture: ComponentFixture<PeriodDatePickerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PeriodDatePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PeriodDatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
