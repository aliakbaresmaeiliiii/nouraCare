import { TestBed } from '@angular/core/testing';

import { TrackDay } from '@app/features/cycle/symptoms-tracker/track-day';

describe('TrackDay', () => {
  let service: TrackDay;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackDay);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
