import { TestBed } from '@angular/core/testing';
import { ForumService } from '@app/shared/services/forum.service';


describe('Forum', () => {
  let service: ForumService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForumService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
