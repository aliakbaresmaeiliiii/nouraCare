import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategorySelectionModalComponent } from '@app/shared/ui/category-selection-modal/category-selection-modal.component';

describe('CategorySelectionModalComponent', () => {
  let component: CategorySelectionModalComponent;
  let fixture: ComponentFixture<CategorySelectionModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CategorySelectionModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategorySelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
