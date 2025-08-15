import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircleProgressBar } from './circle-progress-bar';

describe('CircleProgressBar', () => {
  let component: CircleProgressBar;
  let fixture: ComponentFixture<CircleProgressBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircleProgressBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircleProgressBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
