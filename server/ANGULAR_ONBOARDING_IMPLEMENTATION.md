# Angular 20 Onboarding Implementation Guide

## Prompt for DeepSeek

**Task:** Update the Angular 20 frontend to use the new step-by-step onboarding API from our NestJS backend.

## Backend API Changes (Already Implemented)

The backend now uses a session-based step-by-step onboarding flow:

### New API Endpoints:
1. `POST /api/v1/onboarding/start` - Start new session, returns `{sessionId, expiresAt}`
2. `POST /api/v1/onboarding/:sessionId/step/:stepNumber` - Save step data
3. `GET /api/v1/onboarding/:sessionId/progress` - Get current progress
4. `POST /api/v1/onboarding/:sessionId/complete` - Complete with email/phone
5. `POST /api/v1/onboarding/:sessionId/cancel` - Cancel session

## Angular Implementation Requirements

### 1. Create Onboarding Service

```typescript
// services/onboarding.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OnboardingSession {
  sessionId: string;
  expiresAt: string;
}

export interface OnboardingProgress {
  sessionId: string;
  currentStep: number;
  completed: boolean;
  expiresAt: string;
  data: any;
  steps: Array<{step: number, timestamp: string}>;
}

export interface StepResponse {
  success: boolean;
  currentStep: number;
  message: string;
}

export interface CompleteOnboardingRequest {
  email: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly API_BASE = '/api/v1/onboarding';

  constructor(private http: HttpClient) {}

  startOnboarding(): Observable<OnboardingSession> {
    return this.http.post<OnboardingSession>(`${this.API_BASE}/start`, {});
  }

  saveStep(sessionId: string, stepNumber: number, stepData: any): Observable<StepResponse> {
    return this.http.post<StepResponse>(
      `${this.API_BASE}/${sessionId}/step/${stepNumber}`,
      stepData
    );
  }

  getProgress(sessionId: string): Observable<OnboardingProgress> {
    return this.http.get<OnboardingProgress>(`${this.API_BASE}/${sessionId}/progress`);
  }

  completeOnboarding(sessionId: string, request: CompleteOnboardingRequest): Observable<any> {
    return this.http.post(`${this.API_BASE}/${sessionId}/complete`, request);
  }

  cancelOnboarding(sessionId: string): Observable<any> {
    return this.http.post(`${this.API_BASE}/${sessionId}/cancel`, {});
  }
}
```

### 2. Create Onboarding State Service

```typescript
// services/onboarding-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { OnboardingService, OnboardingProgress } from './onboarding.service';

export interface OnboardingState {
  sessionId: string | null;
  currentStep: number;
  onboardingData: any;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingStateService {
  private readonly initialState: OnboardingState = {
    sessionId: null,
    currentStep: 1,
    onboardingData: {},
    loading: false,
    error: null
  };

  private stateSubject = new BehaviorSubject<OnboardingState>(this.initialState);
  public state$: Observable<OnboardingState> = this.stateSubject.asObservable();

  constructor(private onboardingService: OnboardingService) {}

  // Start new onboarding session
  async startOnboarding(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const result = await this.onboardingService.startOnboarding().toPromise();
      this.updateState({
        sessionId: result.sessionId,
        currentStep: 1,
        onboardingData: {},
        loading: false,
        error: null
      });
    } catch (error: any) {
      this.setError(error.message);
      this.setLoading(false);
      throw error;
    }
  }

  // Save step data
  async saveStep(stepNumber: number, stepData: any): Promise<void> {
    const currentState = this.stateSubject.value;
    if (!currentState.sessionId) {
      throw new Error('No active onboarding session');
    }

    this.setLoading(true);
    this.setError(null);

    try {
      const result = await this.onboardingService.saveStep(
        currentState.sessionId,
        stepNumber,
        stepData
      ).toPromise();

      // Update local state
      this.updateState({
        onboardingData: { ...currentState.onboardingData, ...stepData },
        currentStep: Math.max(currentState.currentStep, stepNumber + 1),
        loading: false
      });
    } catch (error: any) {
      this.setError(error.message);
      this.setLoading(false);
      throw error;
    }
  }

  // Get current progress
  async getProgress(): Promise<void> {
    const currentState = this.stateSubject.value;
    if (!currentState.sessionId) return;

    this.setLoading(true);

    try {
      const result = await this.onboardingService.getProgress(currentState.sessionId).toPromise();
      this.updateState({
        onboardingData: result.data,
        currentStep: result.currentStep,
        loading: false
      });
    } catch (error: any) {
      this.setError(error.message);
      this.setLoading(false);
      throw error;
    }
  }

  // Complete onboarding
  async completeOnboarding(email: string, phone: string): Promise<any> {
    const currentState = this.stateSubject.value;
    if (!currentState.sessionId) {
      throw new Error('No active onboarding session');
    }

    this.setLoading(true);
    this.setError(null);

    try {
      const result = await this.onboardingService.completeOnboarding(
        currentState.sessionId,
        { email, phone }
      ).toPromise();

      // Reset state after completion
      this.resetState();
      return result;
    } catch (error: any) {
      this.setError(error.message);
      this.setLoading(false);
      throw error;
    }
  }

  // Cancel onboarding
  async cancelOnboarding(): Promise<void> {
    const currentState = this.stateSubject.value;
    if (!currentState.sessionId) return;

    try {
      await this.onboardingService.cancelOnboarding(currentState.sessionId).toPromise();
    } catch (error) {
      console.error('Error cancelling onboarding:', error);
    } finally {
      this.resetState();
    }
  }

  // Helper methods
  private updateState(partialState: Partial<OnboardingState>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...partialState });
  }

  private setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  private setError(error: string | null): void {
    this.updateState({ error });
  }

  private resetState(): void {
    this.stateSubject.next(this.initialState);
  }

  // Getters for current state
  getCurrentState(): OnboardingState {
    return this.stateSubject.value;
  }
}
```

### 3. Create Step Components

#### Step 1: Pregnancy Status Component
```typescript
// components/onboarding/step1-pregnancy-status/step1-pregnancy-status.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { OnboardingStateService } from '../../../services/onboarding-state.service';

@Component({
  selector: 'app-step1-pregnancy-status',
  templateUrl: './step1-pregnancy-status.component.html',
  styleUrls: ['./step1-pregnancy-status.component.scss']
})
export class Step1PregnancyStatusComponent {
  @Output() next = new EventEmitter<void>();
  
  pregnancyStatus: string = '';
  loading = false;

  constructor(private onboardingState: OnboardingStateService) {
    // Load existing data if available
    const state = this.onboardingState.getCurrentState();
    this.pregnancyStatus = state.onboardingData.pregnancy_status || '';
  }

  async onSubmit(): Promise<void> {
    if (!this.pregnancyStatus) {
      alert('Please select your pregnancy status');
      return;
    }

    this.loading = true;
    try {
      await this.onboardingState.saveStep(1, { pregnancy_status: this.pregnancyStatus });
      this.next.emit();
    } catch (error: any) {
      alert(`Error saving step: ${error.message}`);
    } finally {
      this.loading = false;
    }
  }
}
```

```html
<!-- step1-pregnancy-status.component.html -->
<div class="onboarding-step">
  <h2>What's your current situation?</h2>
  
  <form (ngSubmit)="onSubmit()">
    <div class="radio-group">
      <label>
        <input
          type="radio"
          value="tracking"
          [(ngModel)]="pregnancyStatus"
          name="pregnancyStatus"
        />
        Tracking my period
      </label>
      
      <label>
        <input
          type="radio"
          value="pregnant"
          [(ngModel)]="pregnancyStatus"
          name="pregnancyStatus"
        />
        I'm pregnant
      </label>
      
      <label>
        <input
          type="radio"
          value="has_child"
          [(ngModel)]="pregnancyStatus"
          name="pregnancyStatus"
        />
        I have a child
      </label>
      
      <label>
        <input
          type="radio"
          value="planning"
          [(ngModel)]="pregnancyStatus"
          name="pregnancyStatus"
        />
        Planning pregnancy
      </label>
    </div>
    
    <button type="submit" class="btn-primary" [disabled]="loading">
      {{ loading ? 'Saving...' : 'Continue' }}
    </button>
  </form>
</div>
```

#### Step 2: Period Details Component
```typescript
// components/onboarding/step2-period-details/step2-period-details.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { OnboardingStateService } from '../../../services/onboarding-state.service';

@Component({
  selector: 'app-step2-period-details',
  templateUrl: './step2-period-details.component.html',
  styleUrls: ['./step2-period-details.component.scss']
})
export class Step2PeriodDetailsComponent {
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  
  lastPeriod: string = '';
  cycleLength: number = 28;
  periodLength: number = 5;
  loading = false;

  constructor(private onboardingState: OnboardingStateService) {
    // Load existing data if available
    const state = this.onboardingState.getCurrentState();
    this.lastPeriod = state.onboardingData.last_period || '';
    this.cycleLength = state.onboardingData.cycle_length || 28;
    this.periodLength = state.onboardingData.period_length || 5;
  }

  async onSubmit(): Promise<void> {
    if (!this.lastPeriod) {
      alert('Please enter your last period date');
      return;
    }

    this.loading = true;
    try {
      await this.onboardingState.saveStep(2, {
        last_period: new Date(this.lastPeriod).toISOString(),
        cycle_length: this.cycleLength,
        period_length: this.periodLength,
      });
      this.next.emit();
    } catch (error: any) {
      alert(`Error saving step: ${error.message}`);
    } finally {
      this.loading = false;
    }
  }

  onBack(): void {
    this.back.emit();
  }
}
```

```html
<!-- step2-period-details.component.html -->
<div class="onboarding-step">
  <h2>Tell us about your cycle</h2>
  
  <form (ngSubmit)="onSubmit()">
    <div class="form-group">
      <label>Last period start date:</label>
      <input
        type="date"
        [(ngModel)]="lastPeriod"
        name="lastPeriod"
        required
      />
    </div>
    
    <div class="form-group">
      <label>Cycle length (days):</label>
      <input
        type="number"
        min="21"
        max="35"
        [(ngModel)]="cycleLength"
        name="cycleLength"
      />
    </div>
    
    <div class="form-group">
      <label>Period duration (days):</label>
      <input
        type="number"
        min="3"
        max="7"
        [(ngModel)]="periodLength"
        name="periodLength"
      />
    </div>
    
    <div class="button-group">
      <button type="button" (click)="onBack()" class="btn-secondary">
        Back
      </button>
      <button type="submit" class="btn-primary" [disabled]="loading">
        {{ loading ? 'Saving...' : 'Continue' }}
      </button>
    </div>
  </form>
</div>
```

### 4. Main Onboarding Wizard Component

```typescript
// components/onboarding-wizard/onboarding-wizard.component.ts
import { Component, OnInit } from '@angular/core';
import { OnboardingStateService } from '../../services/onboarding-state.service';

@Component({
  selector: 'app-onboarding-wizard',
  templateUrl: './onboarding-wizard.component.html',
  styleUrls: ['./onboarding-wizard.component.scss']
})
export class OnboardingWizardComponent implements OnInit {
  currentStep = 1;
  loading = false;

  constructor(private onboardingState: OnboardingStateService) {}

  async ngOnInit(): Promise<void> {
    await this.initializeOnboarding();
  }

  private async initializeOnboarding(): Promise<void> {
    const state = this.onboardingState.getCurrentState();
    
    if (!state.sessionId) {
      // Start new session
      await this.onboardingState.startOnboarding();
    } else {
      // Get current progress for existing session
      await this.onboardingState.getProgress();
    }

    // Sync with current step from state
    this.currentStep = this.onboardingState.getCurrentState().currentStep;
  }

  onNext(): void {
    this.currentStep++;
  }

  onBack(): void {
    this.currentStep--;
  }

  getProgressSteps(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
```

```html
<!-- onboarding-wizard.component.html -->
<div class="onboarding-wizard">
  <div class="progress-bar">
    <div
      *ngFor="let step of getProgressSteps()"
      class="progress-step"
      [class.active]="currentStep >= step"
    >
      {{ step }}
    </div>
  </div>
  
  <div class="step-content">
    <app-step1-pregnancy-status
      *ngIf="currentStep === 1"
      (next)="onNext()"
    ></app-step1-pregnancy-status>
    
    <app-step2-period-details
      *ngIf="currentStep === 2"
      (next)="onNext()"
      (back)="onBack()"
    ></app-step2-period-details>
    
    <!-- Add other step components similarly -->
  </div>
</div>
```

### 5. Module Configuration

```typescript
// onboarding.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { OnboardingWizardComponent } from './components/onboarding-wizard/onboarding-wizard.component';
import { Step1PregnancyStatusComponent } from './components/onboarding/step1-pregnancy-status/step1-pregnancy-status.component';
import { Step2PeriodDetailsComponent } from './components/onboarding/step2-period-details/step2-period-details.component';
// Import other step components...

@NgModule({
  declarations: [
    OnboardingWizardComponent,
    Step1PregnancyStatusComponent,
    Step2PeriodDetailsComponent,
    // Declare other step components...
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  exports: [
    OnboardingWizardComponent
  ]
})
export class OnboardingModule { }
```

## Key Implementation Points

1. **Service Layer**: Use Angular services with HttpClient for API calls
2. **State Management**: Use BehaviorSubject for reactive state management
3. **Component Communication**: Use @Output() events for step navigation
4. **Reactive Forms**: Use Angular forms with ngModel for data binding
5. **Error Handling**: Implement proper error handling and loading states
6. **Session Persistence**: Store session ID and resume progress

## Testing Flow

1. User starts onboarding → creates session
2. Each step saves independently to backend
3. Progress is maintained across browser refreshes
4. Final completion creates user account
5. Error handling for network issues

This implementation provides a robust, step-by-step onboarding experience in Angular 20 that integrates seamlessly with the new backend API.
