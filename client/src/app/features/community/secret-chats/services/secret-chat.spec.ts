import { TestBed } from '@angular/core/testing';

import { SecretChatsService } from '@app/features/community/secret-chats/services/secret-chat.service';

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
