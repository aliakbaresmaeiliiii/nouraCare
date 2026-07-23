import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateDiscussionModalComponent } from '@app/shared/ui/create-discussion-modal/create-discussion-modal.component';

describe('CreateDiscussionModalComponent', () => {
  let component: CreateDiscussionModalComponent;
  let fixture: ComponentFixture<CreateDiscussionModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CreateDiscussionModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateDiscussionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
