import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { InviteFriendsComponent } from '@app/features/content/invite-friends/invite-friends.component';
import { GrowthService } from '@app/shared/services/growth.service';
import { of } from 'rxjs';

describe('InviteFriendsComponent', () => {
  let component: InviteFriendsComponent;
  let fixture: ComponentFixture<InviteFriendsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteFriendsComponent],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        {
          provide: GrowthService,
          useValue: {
            getSummary: () =>
              of({
                referralCode: 'TEST',
                growthPoints: 0,
                checkInStreak: 0,
                lastCheckInDayIso: null,
                checkedInToday: false,
                successfulReferrals: 0,
              }),
            buildInviteUrl: (path: string) => `https://example.com${path}`,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InviteFriendsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
