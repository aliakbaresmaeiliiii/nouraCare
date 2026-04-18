import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { CheckVersionComponent } from './check-version.component';

describe('CheckVersionComponent', () => {
  let component: CheckVersionComponent;
  let fixture: ComponentFixture<CheckVersionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckVersionComponent],
      providers: [provideRouter([]), provideIonicAngular()],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
