import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { SavedInformationComponent } from '@app/features/profile/saved-information/saved-information.component';

describe('SavedInformationComponent', () => {
  let component: SavedInformationComponent;
  let fixture: ComponentFixture<SavedInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedInformationComponent],
      providers: [provideRouter([]), provideIonicAngular()],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
