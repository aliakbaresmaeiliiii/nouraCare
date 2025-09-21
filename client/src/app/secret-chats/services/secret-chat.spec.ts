import { TestBed } from '@angular/core/testing';

import { SecretChatsService } from './secret-chat';

describe('SecretChat', () => {
  let service: SecretChatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecretChatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
