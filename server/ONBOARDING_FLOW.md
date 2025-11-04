# Onboarding Flow - Step by Step Approach

## Overview
The onboarding process has been redesigned to use a step-by-step approach where users fill all steps first and then save to the database. This eliminates the need for user ID during the initial steps.

## New API Endpoints

### 1. Start Onboarding Session
**POST** `/api/v1/onboarding/start`

Starts a new onboarding session and returns a session ID.

**Response:**
```json
{
  "sessionId": "abc123def456",
  "expiresAt": "2025-11-05T10:02:17.000Z"
}
```

### 2. Save Onboarding Step
**POST** `/api/v1/onboarding/:sessionId/step/:stepNumber`

Saves data for a specific step in the onboarding process.

**Parameters:**
- `sessionId`: The session ID from step 1
- `stepNumber`: The step number (1, 2, 3, etc.)

**Body:** Partial `OnboardingDataDto` for the specific step

**Example for Step 1:**
```json
{
  "pregnancy_status": "tracking"
}
```

**Example for Step 2:**
```json
{
  "last_period": "2025-10-15T00:00:00.000Z",
  "cycle_length": 28,
  "period_length": 5
}
```

### 3. Get Onboarding Progress
**GET** `/api/v1/onboarding/:sessionId/progress`

Retrieves the current progress and combined data for a session.

**Response:**
```json
{
  "sessionId": "abc123def456",
  "currentStep": 2,
  "completed": false,
  "expiresAt": "2025-11-05T10:02:17.000Z",
  "data": {
    "pregnancy_status": "tracking",
    "last_period": "2025-10-15T00:00:00.000Z",
    "cycle_length": 28,
    "period_length": 5
  },
  "steps": [
    {
      "step": 1,
      "timestamp": "2025-11-04T10:02:17.000Z"
    },
    {
      "step": 2,
      "timestamp": "2025-11-04T10:02:18.000Z"
    }
  ]
}
```

### 4. Complete Onboarding
**POST** `/api/v1/onboarding/:sessionId/complete`

Completes the onboarding process by creating a user and saving all data to the database.

**Body:**
```json
{
  "email": "user@example.com",
  "phone": "+1234567890"
}
```

### 5. Cancel Onboarding
**POST** `/api/v1/onboarding/:sessionId/cancel`

Cancels the onboarding session and deletes temporary data.

## Step Definitions

### Step 1: Pregnancy Status
- **Required field:** `pregnancy_status`
- **Possible values:** `tracking`, `pregnant`, `has_child`, `planning`

### Step 2: Period Tracking Details
- **Required if:** `pregnancy_status` is `tracking`
- **Fields:** `last_period`, `cycle_length`, `period_length`

### Step 3: Pregnancy Details
- **Required if:** `pregnancy_status` is `pregnant`
- **Fields:** `pregnancy_week`, `pregnancy_progress`

### Step 4: Health Goals & Notifications
- **Fields:** `health_goals`, `notifications`

## Technical Implementation

### Temporary Storage
- Uses `Map<string, TemporaryOnboardingData>` for in-memory storage
- Each session expires after 24 hours
- Automatic cleanup of expired sessions every hour
- Session data is combined from all steps when completing

### Data Flow
1. User starts session → gets session ID
2. User fills step 1 → saves to temporary storage
3. User fills step 2 → saves to temporary storage
4. User fills step 3 → saves to temporary storage
5. User provides email/phone → creates user and saves all data to database
6. Temporary data is cleaned up

### Benefits
- No user ID required during initial steps
- Data is validated at each step
- Users can complete onboarding at their own pace
- Session-based approach prevents data loss
- Automatic cleanup prevents memory leaks
