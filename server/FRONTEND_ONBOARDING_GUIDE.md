# Frontend Onboarding Implementation Guide

## Overview
The frontend needs to be updated to use the new step-by-step onboarding API. Here's how to implement it in React.

## Required Changes

### 1. Onboarding Service (Frontend)

Create a new service file to handle the onboarding API calls:

```javascript
// services/onboardingService.js
const API_BASE = '/api/v1/onboarding';

class OnboardingService {
  async startOnboarding() {
    const response = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  async saveStep(sessionId, stepNumber, stepData) {
    const response = await fetch(`${API_BASE}/${sessionId}/step/${stepNumber}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stepData),
    });
    return response.json();
  }

  async getProgress(sessionId) {
    const response = await fetch(`${API_BASE}/${sessionId}/progress`);
    return response.json();
  }

  async completeOnboarding(sessionId, email, phone) {
    const response = await fetch(`${API_BASE}/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, phone }),
    });
    return response.json();
  }

  async cancelOnboarding(sessionId) {
    const response = await fetch(`${API_BASE}/${sessionId}/cancel`, {
      method: 'POST',
    });
    return response.json();
  }
}

export default new OnboardingService();
```

### 2. Onboarding Context (React)

Create a context to manage the onboarding state:

```javascript
// contexts/OnboardingContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import onboardingService from '../services/onboardingService';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start new onboarding session
  const startOnboarding = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onboardingService.startOnboarding();
      setSessionId(result.sessionId);
      setCurrentStep(1);
      setOnboardingData({});
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Save step data
  const saveStep = async (stepNumber, stepData) => {
    if (!sessionId) {
      throw new Error('No active onboarding session');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await onboardingService.saveStep(sessionId, stepNumber, stepData);
      
      // Update local state
      setOnboardingData(prev => ({ ...prev, ...stepData }));
      setCurrentStep(Math.max(currentStep, stepNumber + 1));
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get current progress
  const getProgress = async () => {
    if (!sessionId) return null;
    
    setLoading(true);
    try {
      const result = await onboardingService.getProgress(sessionId);
      setOnboardingData(result.data);
      setCurrentStep(result.currentStep);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async (email, phone) => {
    if (!sessionId) {
      throw new Error('No active onboarding session');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await onboardingService.completeOnboarding(sessionId, email, phone);
      
      // Reset state after completion
      setSessionId(null);
      setCurrentStep(1);
      setOnboardingData({});
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel onboarding
  const cancelOnboarding = async () => {
    if (!sessionId) return;
    
    try {
      await onboardingService.cancelOnboarding(sessionId);
    } catch (err) {
      console.error('Error cancelling onboarding:', err);
    } finally {
      // Reset state
      setSessionId(null);
      setCurrentStep(1);
      setOnboardingData({});
      setError(null);
    }
  };

  const value = {
    sessionId,
    currentStep,
    onboardingData,
    loading,
    error,
    startOnboarding,
    saveStep,
    getProgress,
    completeOnboarding,
    cancelOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
```

### 3. Step Components

Create individual step components:

```javascript
// components/onboarding/Step1PregnancyStatus.js
import React, { useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

const Step1PregnancyStatus = ({ onNext }) => {
  const { saveStep, onboardingData } = useOnboarding();
  const [pregnancyStatus, setPregnancyStatus] = useState(onboardingData.pregnancy_status || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pregnancyStatus) {
      alert('Please select your pregnancy status');
      return;
    }

    try {
      await saveStep(1, { pregnancy_status: pregnancyStatus });
      onNext();
    } catch (error) {
      alert(`Error saving step: ${error.message}`);
    }
  };

  return (
    <div className="onboarding-step">
      <h2>What's your current situation?</h2>
      <form onSubmit={handleSubmit}>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="tracking"
              checked={pregnancyStatus === 'tracking'}
              onChange={(e) => setPregnancyStatus(e.target.value)}
            />
            Tracking my period
          </label>
          
          <label>
            <input
              type="radio"
              value="pregnant"
              checked={pregnancyStatus === 'pregnant'}
              onChange={(e) => setPregnancyStatus(e.target.value)}
            />
            I'm pregnant
          </label>
          
          <label>
            <input
              type="radio"
              value="has_child"
              checked={pregnancyStatus === 'has_child'}
              onChange={(e) => setPregnancyStatus(e.target.value)}
            />
            I have a child
          </label>
          
          <label>
            <input
              type="radio"
              value="planning"
              checked={pregnancyStatus === 'planning'}
              onChange={(e) => setPregnancyStatus(e.target.value)}
            />
            Planning pregnancy
          </label>
        </div>
        
        <button type="submit" className="btn-primary">
          Continue
        </button>
      </form>
    </div>
  );
};

export default Step1PregnancyStatus;
```

```javascript
// components/onboarding/Step2PeriodDetails.js
import React, { useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

const Step2PeriodDetails = ({ onNext, onBack }) => {
  const { saveStep, onboardingData } = useOnboarding();
  const [lastPeriod, setLastPeriod] = useState(onboardingData.last_period || '');
  const [cycleLength, setCycleLength] = useState(onboardingData.cycle_length || 28);
  const [periodLength, setPeriodLength] = useState(onboardingData.period_length || 5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!lastPeriod) {
      alert('Please enter your last period date');
      return;
    }

    try {
      await saveStep(2, {
        last_period: new Date(lastPeriod).toISOString(),
        cycle_length: parseInt(cycleLength),
        period_length: parseInt(periodLength),
      });
      onNext();
    } catch (error) {
      alert(`Error saving step: ${error.message}`);
    }
  };

  return (
    <div className="onboarding-step">
      <h2>Tell us about your cycle</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Last period start date:</label>
          <input
            type="date"
            value={lastPeriod}
            onChange={(e) => setLastPeriod(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Cycle length (days):</label>
          <input
            type="number"
            min="21"
            max="35"
            value={cycleLength}
            onChange={(e) => setCycleLength(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Period duration (days):</label>
          <input
            type="number"
            min="3"
            max="7"
            value={periodLength}
            onChange={(e) => setPeriodLength(e.target.value)}
          />
        </div>
        
        <div className="button-group">
          <button type="button" onClick={onBack} className="btn-secondary">
            Back
          </button>
          <button type="submit" className="btn-primary">
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step2PeriodDetails;
```

### 4. Main Onboarding Component

```javascript
// components/OnboardingWizard.js
import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../contexts/OnboardingContext';
import Step1PregnancyStatus from './onboarding/Step1PregnancyStatus';
import Step2PeriodDetails from './onboarding/Step2PeriodDetails';
import Step3PregnancyDetails from './onboarding/Step3PregnancyDetails';
import Step4HealthGoals from './onboarding/Step4HealthGoals';
import Step5Complete from './onboarding/Step5Complete';

const OnboardingWizard = () => {
  const { startOnboarding, currentStep, sessionId, getProgress } = useOnboarding();
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Initialize onboarding when component mounts
    const initializeOnboarding = async () => {
      if (!sessionId) {
        await startOnboarding();
      } else {
        // If we have a session, get current progress
        await getProgress();
      }
    };
    
    initializeOnboarding();
  }, []);

  useEffect(() => {
    // Sync with context currentStep
    setStep(currentStep);
  }, [currentStep]);

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1PregnancyStatus onNext={handleNext} />;
      case 2:
        return <Step2PeriodDetails onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <Step3PregnancyDetails onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <Step4HealthGoals onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <Step5Complete onBack={handleBack} />;
      default:
        return <Step1PregnancyStatus onNext={handleNext} />;
    }
  };

  return (
    <div className="onboarding-wizard">
      <div className="progress-bar">
        {[1, 2, 3, 4, 5].map((stepNum) => (
          <div
            key={stepNum}
            className={`progress-step ${step >= stepNum ? 'active' : ''}`}
          >
            {stepNum}
          </div>
        ))}
      </div>
      
      {renderStep()}
    </div>
  );
};

export default OnboardingWizard;
```

### 5. App Integration

```javascript
// App.js
import React from 'react';
import { OnboardingProvider } from './contexts/OnboardingContext';
import OnboardingWizard from './components/OnboardingWizard';

function App() {
  return (
    <OnboardingProvider>
      <div className="App">
        <OnboardingWizard />
      </div>
    </OnboardingProvider>
  );
}

export default App;
```

## Key Frontend Changes

1. **Session Management**: Store session ID in context/state
2. **Step-by-step Flow**: Each step saves independently
3. **Progress Persistence**: Resume from where user left off
4. **Error Handling**: Handle API errors gracefully
5. **Validation**: Client-side validation for each step

## Testing the Flow

1. Start the onboarding process
2. Fill step 1 (pregnancy status)
3. Fill step 2 (period details) - only if tracking
4. Fill step 3 (pregnancy details) - only if pregnant
5. Fill step 4 (health goals & notifications)
6. Complete with email/phone

The frontend will automatically handle the session management and step progression while the backend stores everything temporarily until final completion.
