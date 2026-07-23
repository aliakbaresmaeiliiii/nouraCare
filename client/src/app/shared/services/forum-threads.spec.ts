import { TestBed } from '@angular/core/testing';

import { ForumThreadsService } from '@app/shared/services/forum-threads.service';

describe('ForumThreadsService', () => {
  let service: ForumThreadsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForumThreadsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
