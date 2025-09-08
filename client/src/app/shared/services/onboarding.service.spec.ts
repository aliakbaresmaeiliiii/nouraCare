import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OnboardingService, OnboardingDataDto } from './onboarding.service';
import { environment } from '../../../environments/environment';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OnboardingService]
    });
    service = TestBed.inject(OnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save onboarding data', () => {
    const mockData: OnboardingDataDto = {
      pregnancy_status: 'tracking',
      last_period: '2024-01-01',
      cycle_length: 28,
      period_length: 5,
      health_goals: '["cycle_tracking", "symptoms"]',
      notifications: 'yes'
    };

    const mockResponse = {
      sessionId: 'test-session-123',
      message: 'Data saved successfully'
    };

    service.saveOnboardingData(mockData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiEndPoint}onboarding/save`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockData);
    req.flush(mockResponse);
  });

  it('should get onboarding data by session ID', () => {
    const sessionId = 'test-session-123';
    const mockResponse = {
      sessionId: sessionId,
      data: {
        pregnancy_status: 'tracking',
        last_period: '2024-01-01',
        cycle_length: 28,
        period_length: 5,
        health_goals: '["cycle_tracking"]',
        notifications: 'yes'
      },
      createdAt: '2024-01-01T00:00:00Z'
    };

    service.getOnboardingData(sessionId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiEndPoint}onboarding/${sessionId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should complete onboarding', () => {
    const sessionId = 'test-session-123';
    const email = 'test@example.com';
    const phone = '+1234567890';
    const mockResponse = {
      success: true,
      message: 'Onboarding completed successfully',
      userId: 'user-123',
      accessToken: 'token-123'
    };

    service.completeOnboarding(sessionId, email, phone).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiEndPoint}onboarding/${sessionId}/complete`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email, phone });
    req.flush(mockResponse);
  });

  it('should generate unique session IDs', () => {
    const sessionId1 = service.generateSessionId();
    const sessionId2 = service.generateSessionId();
    
    expect(sessionId1).toContain('onboarding_');
    expect(sessionId2).toContain('onboarding_');
    expect(sessionId1).not.toEqual(sessionId2);
  });

  it('should manage session ID in localStorage', () => {
    const sessionId = 'test-session-123';
    
    // Test saving
    service.saveSessionId(sessionId);
    expect(service.getSessionId()).toBe(sessionId);
    
    // Test clearing
    service.clearSessionId();
    expect(service.getSessionId()).toBeNull();
  });
});
