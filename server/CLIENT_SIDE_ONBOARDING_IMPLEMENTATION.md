# Client-Side Onboarding Implementation Guide

## Overview
This guide provides the complete client-side implementation for handling the onboarding flow where users provide data BEFORE registration.

## API Endpoints

### 1. Save Onboarding Data (Before Registration)
```http
POST /api/v1/onboarding/save
Content-Type: application/json

{
  "pregnancy_status": "pregnant",
  "last_period": "2024-01-01T00:00:00.000Z",
  "cycle_length": 28,
  "period_length": 5,
  "pregnancy_week": 12,
  "pregnancy_progress": "first_trimester",
  "health_goals": "{\"track_period\": true, \"cycle_insights\": true}",
  "notifications": true
}
```

**Response:**
```json
{
  "sessionId": "abc123sessionid",
  "expiresAt": "2025-10-13T12:00:00.000Z"
}
```

### 2. Complete Registration with Onboarding
```http
POST /api/v1/onboarding/{sessionId}/complete
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+1234567890"
}
```

### 3. Alternative: Direct Registration with Onboarding
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+1234567890",
  "onboardingData": {
    "pregnancy_status": "tracking",
    "last_period": "2024-10-01T00:00:00.000Z",
    "cycle_length": 30,
    "period_length": 6,
    "health_goals": "{\"track_period\": true}",
    "notifications": true
  }
}
```

## React Implementation

### 1. Onboarding Service (onboardingService.js)
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class OnboardingService {
  // Save onboarding data before registration
  async saveOnboardingData(onboardingData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/onboarding/save`, onboardingData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to save onboarding data: ${error.response?.data?.message || error.message}`);
    }
  }

  // Complete registration with onboarding session
  async completeOnboardingWithRegistration(sessionId, email, phone) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/onboarding/${sessionId}/complete`,
        { email, phone }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to complete registration: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get onboarding data for authenticated user
  async getUserOnboardingData(token) {
    try {
      const response = await axios.get(`${API_BASE_URL}/onboarding/user/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get onboarding data: ${error.response?.data?.message || error.message}`);
    }
  }

  // Update onboarding data for authenticated user
  async updateUserOnboardingData(token, onboardingData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/onboarding/user/update`,
        onboardingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update onboarding data: ${error.response?.data?.message || error.message}`);
    }
  }
}

export default new OnboardingService();
```

### 2. Onboarding Context (OnboardingContext.jsx)
```javascript
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
  const [onboardingData, setOnboardingData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save onboarding data to session
  const saveOnboardingData = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await onboardingService.saveOnboardingData(data);
      setSessionId(response.sessionId);
      setOnboardingData(data);
      localStorage.setItem('onboardingSessionId', response.sessionId);
      localStorage.setItem('onboardingData', JSON.stringify(data));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Complete registration with onboarding
  const completeRegistration = async (email, phone) => {
    if (!sessionId) {
      throw new Error('No onboarding session found');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await onboardingService.completeOnboardingWithRegistration(
        sessionId,
        email,
        phone
      );
      
      // Clear session data after successful registration
      localStorage.removeItem('onboardingSessionId');
      localStorage.removeItem('onboardingData');
      setSessionId(null);
      setOnboardingData(null);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved session on app start
  useEffect(() => {
    const savedSessionId = localStorage.getItem('onboardingSessionId');
    const savedData = localStorage.getItem('onboardingData');
    
    if (savedSessionId && savedData) {
      setSessionId(savedSessionId);
      setOnboardingData(JSON.parse(savedData));
    }
  }, []);

  const value = {
    onboardingData,
    sessionId,
    isLoading,
    error,
    saveOnboardingData,
    completeRegistration,
    clearOnboarding: () => {
      setOnboardingData(null);
      setSessionId(null);
      localStorage.removeItem('onboardingSessionId');
      localStorage.removeItem('onboardingData');
    }
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
```

### 3. Onboarding Form Component (OnboardingForm.jsx)
```javascript
import React, { useState } from 'react';
import { useOnboarding } from '../contexts/OnboardingContext';

const OnboardingForm = ({ onComplete }) => {
  const { saveOnboardingData, isLoading, error } = useOnboarding();
  const [formData, setFormData] = useState({
    pregnancy_status: '',
    last_period: '',
    cycle_length: '',
    period_length: '',
    pregnancy_week: '',
    pregnancy_progress: '',
    health_goals: {
      track_period: false,
      cycle_insights: false,
      pregnancy_tracking: false,
      nutrition_tips: false
    },
    notifications: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleHealthGoalChange = (goal, checked) => {
    setFormData(prev => ({
      ...prev,
      health_goals: {
        ...prev.health_goals,
        [goal]: checked
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        health_goals: JSON.stringify(formData.health_goals)
      };
      
      await saveOnboardingData(dataToSend);
      onComplete?.();
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
    }
  };

  return (
    <div className="onboarding-form">
      <h2>Tell us about yourself</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Pregnancy Status</label>
          <select 
            name="pregnancy_status" 
            value={formData.pregnancy_status}
            onChange={handleInputChange}
            required
          >
            <option value="">Select status</option>
            <option value="tracking">Tracking Period</option>
            <option value="trying">Trying to Conceive</option>
            <option value="pregnant">Pregnant</option>
            <option value="postpartum">Postpartum</option>
            <option value="has_child">Has Child</option>
          </select>
        </div>

        <div className="form-group">
          <label>Last Period Date</label>
          <input
            type="date"
            name="last_period"
            value={formData.last_period}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>Cycle Length (days)</label>
          <input
            type="number"
            name="cycle_length"
            value={formData.cycle_length}
            onChange={handleInputChange}
            min="21"
            max="35"
          />
        </div>

        <div className="form-group">
          <label>Period Duration (days)</label>
          <input
            type="number"
            name="period_length"
            value={formData.period_length}
            onChange={handleInputChange}
            min="3"
            max="7"
          />
        </div>

        {formData.pregnancy_status === 'pregnant' && (
          <>
            <div className="form-group">
              <label>Pregnancy Week</label>
              <input
                type="number"
                name="pregnancy_week"
                value={formData.pregnancy_week}
                onChange={handleInputChange}
                min="1"
                max="42"
              />
            </div>
            <div className="form-group">
              <label>Pregnancy Progress</label>
              <select 
                name="pregnancy_progress" 
                value={formData.pregnancy_progress}
                onChange={handleInputChange}
              >
                <option value="">Select trimester</option>
                <option value="first_trimester">First Trimester</option>
                <option value="second_trimester">Second Trimester</option>
                <option value="third_trimester">Third Trimester</option>
              </select>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Health Goals</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.health_goals.track_period}
                onChange={(e) => handleHealthGoalChange('track_period', e.target.checked)}
              />
              Track Period
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.health_goals.cycle_insights}
                onChange={(e) => handleHealthGoalChange('cycle_insights', e.target.checked)}
              />
              Cycle Insights
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.health_goals.pregnancy_tracking}
                onChange={(e) => handleHealthGoalChange('pregnancy_tracking', e.target.checked)}
              />
              Pregnancy Tracking
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.health_goals.nutrition_tips}
                onChange={(e) => handleHealthGoalChange('nutrition_tips', e.target.checked)}
              />
              Nutrition Tips
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="notifications"
              checked={formData.notifications}
              onChange={handleInputChange}
            />
            Enable Notifications
          </label>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Continue to Registration'}
        </button>
      </form>
    </div>
  );
};

export default OnboardingForm;
```

### 4. Registration Component (RegistrationForm.jsx)
```javascript
import React, { useState } from 'react';
import { useOnboarding } from '../contexts/OnboardingContext';

const RegistrationForm = ({ onSuccess }) => {
  const { completeRegistration, sessionId, onboardingData } = useOnboarding();
  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await completeRegistration(formData.email, formData.phone);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="registration-form">
        <h2>Complete Registration</h2>
        <p>Please complete the onboarding process first.</p>
      </div>
    );
  }

  return (
    <div className="registration-form">
      <h2>Create Your Account</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="onboarding-summary">
          <h3>Your Onboarding Data</h3>
          <p><strong>Pregnancy Status:</strong> {onboardingData?.pregnancy_status}</p>
          {onboardingData?.last_period && (
            <p><strong>Last Period:</strong> {onboardingData.last_period}</p>
          )}
          {onboardingData?.cycle_length && (
            <p><strong>Cycle Length:</strong> {onboardingData.cycle_length} days</p>
          )}
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;
```

### 5. Main App Integration (App.jsx)
```javascript
import React, { useState } from 'react';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import OnboardingForm from './components/OnboardingForm';
import RegistrationForm from './components/RegistrationForm';
import EmailVerification from './components/EmailVerification';

const AppContent = () => {
  const { sessionId } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(sessionId ? 'registration' : 'onboarding');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleOnboardingComplete = () => {
    setCurrentStep('registration');
  };

  const handleRegistrationSuccess = (email) => {
    setRegisteredEmail(email);
    setCurrentStep('verification');
  };

  const handleVerificationSuccess = () => {
    setCurrentStep('success');
  };

  return (
    <div className="app">
      <header>
        <h1>Gahvareh</h1>
      </header>

      <main>
        {currentStep === 'onboarding' && (
          <OnboardingForm onComplete={handleOnboardingComplete} />
        )}

        {currentStep === 'registration' && (
          <RegistrationForm onSuccess={handleRegistrationSuccess} />
        )}

        {currentStep === 'verification' && (
          <EmailVerification 
            email={registeredEmail}
            onSuccess={handleVerificationSuccess}
          />
        )}

        {currentStep === 'success' && (
          <div className="success-screen">
            <h2>Welcome to Gahvareh!</h2>
            <p>Your account has been created successfully.</p>
            <p>You can now access all features with your personalized experience.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <OnboardingProvider>
      <AppContent />
    </OnboardingProvider>
  );
};

export default App;
```

## Usage Flow

1. **User opens app** → Shows onboarding form
2. **User fills onboarding** → Data saved to session, sessionId stored
3. **User registers** → Registration uses sessionId to link onboarding data
4. **User verifies email** → Standard verification flow
5. **User logs in** → Onboarding data included in login response

## Key Features

- **Session persistence**: Onboarding data survives page refreshes
- **Error handling**: Comprehensive error messages
- **Form validation**: Client-side validation with user feedback
- **Progress tracking**: Clear step-by-step flow
- **Data persistence**: Onboarding data saved to database after registration

This implementation provides a seamless user experience where onboarding data is collected before account creation and properly linked to the user's account.
