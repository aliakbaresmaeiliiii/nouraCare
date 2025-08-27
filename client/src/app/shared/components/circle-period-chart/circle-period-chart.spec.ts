import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CirclePeriodChart } from './circle-period-chart';

describe('CirclePeriodChart', () => {
  let component: CirclePeriodChart;
  let fixture: ComponentFixture<CirclePeriodChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CirclePeriodChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CirclePeriodChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
