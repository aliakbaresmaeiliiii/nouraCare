# Onboarding Data Storage Implementation

## Overview

This implementation provides a dedicated table for storing user onboarding data after successful registration. The system now properly handles onboarding scenarios like "cycle my period" and other user preferences.

## Database Schema

### New Table: `onboarding_data`

The `onboarding_data` table stores all user onboarding information with the following structure:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int (PK) | Auto-increment primary key |
| `userId` | Int (FK) | Reference to user table (unique) |
| `sessionId` | String | Temporary session ID for pre-registration |
| `pregnancyStatus` | String | User's pregnancy status |
| `lastPeriodDate` | DateTime | Last period start date |
| `cycleLength` | Int | Menstrual cycle length in days |
| `periodDuration` | Int | Period duration in days |
| `pregnancyWeek` | Int | Current pregnancy week |
| `pregnancyProgress` | String | Pregnancy progress details |
| `healthGoals` | Text | JSON string of health goals |
| `notificationsEnabled` | Boolean | Notification preferences |
| `selectedOptions` | JSON | Additional onboarding options |
| `onboardingStep` | Int | Current onboarding step |
| `isCompleted` | Boolean | Whether onboarding is complete |
| `createdAt` | DateTime | Record creation timestamp |
| `updatedAt` | DateTime | Record update timestamp |

## Implementation Details

### 1. Registration Flow

The system supports two onboarding approaches:

#### A. Direct Registration with Onboarding Data
```typescript
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "onboardingData": {
    "pregnancy_status": "tracking",
    "last_period": "2025-10-01T00:00:00.000Z",
    "cycle_length": 28,
    "period_length": 5,
    "health_goals": "{\"track_period\": true, \"cycle_insights\": true}",
    "notifications": true
  }
}
```

#### B. Session-based Registration
1. Save temporary onboarding data first:
```typescript
POST /api/v1/onboarding/save-temporary
{
  "pregnancy_status": "tracking",
  "last_period": "2025-10-01T00:00:00.000Z",
  "cycle_length": 28,
  "period_length": 5
}
```

2. Complete registration with session:
```typescript
POST /api/v1/onboarding/complete-with-registration
{
  "sessionId": "abc123session",
  "email": "user@example.com",
  "phone": "+1234567890"
}
```

### 2. Data Storage Logic

The system stores onboarding data in two places for compatibility:

1. **Primary Storage**: `onboarding_data` table (dedicated table)
2. **Secondary Storage**: Critical fields in `user` table (backward compatibility)

### 3. Key Features

#### A. Support for "Cycle My Period" and Other Options
The `selectedOptions` JSON field can store various user choices:
- Cycle tracking preferences
- Health goal selections
- Feature preferences
- Custom onboarding choices

#### B. Data Mapping
The service automatically maps client field names to database field names:
- `pregnancy_status` → `pregnancyStatus`
- `last_period` → `lastPeriodDate`
- `cycle_length` → `cycleLength`
- `period_length` → `periodDuration`

#### C. Status Mapping
Converts client status strings to database enums:
- `"tracking"` → `"PLANNING_PREGNANCY"`
- `"pregnant"` → `"PREGNANT"`
- `"has_child"` → `"HAS_CHILD"`

## API Endpoints

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register with onboarding data
- `POST /api/v1/auth/verify-email` - Verify email and complete registration

### Onboarding Endpoints
- `POST /api/v1/onboarding/save-temporary` - Save temporary onboarding data
- `POST /api/v1/onboarding/complete-with-registration` - Complete registration with session
- `GET /api/v1/onboarding/temporary/:sessionId` - Get temporary data

## Testing

Use the provided `test-onboarding.http` file to test the implementation:

1. Test direct registration with onboarding data
2. Test session-based registration flow
3. Verify data is stored in both `onboarding_data` and `user` tables

## Benefits

1. **Dedicated Storage**: Onboarding data is properly organized in its own table
2. **Flexibility**: Supports various onboarding scenarios and user choices
3. **Backward Compatibility**: Maintains existing user table fields
4. **Extensibility**: JSON fields allow for future feature additions
5. **Session Management**: Supports pre-registration onboarding flows

## Example Use Cases

### Cycle Tracking Onboarding
```json
{
  "pregnancy_status": "tracking",
  "last_period": "2025-10-01T00:00:00.000Z",
  "cycle_length": 28,
  "period_length": 5,
  "health_goals": "{\"track_period\": true, \"cycle_insights\": true, \"fertility_tracking\": true}",
  "selectedOptions": {
    "cycle_tracking": true,
    "symptom_tracking": true,
    "mood_tracking": false
  }
}
```

### Pregnancy Planning Onboarding
```json
{
  "pregnancy_status": "planning",
  "last_period": "2025-10-01T00:00:00.000Z",
  "cycle_length": 30,
  "health_goals": "{\"pregnancy_planning\": true, \"fertility_insights\": true}",
  "selectedOptions": {
    "ovulation_tracking": true,
    "fertility_window": true,
    "pregnancy_tests": false
  }
}
```

This implementation ensures that user onboarding preferences are properly stored and can be used to personalize the user experience throughout the application.
