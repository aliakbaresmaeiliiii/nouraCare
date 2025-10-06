# Pregnancy Planning Feature Implementation

## Overview
The Pregnancy Planning feature has been successfully implemented in the Gahvareh server application. This feature allows users to track and manage their pregnancy planning journey with comprehensive data tracking and fertility calculations.

## Database Schema

### PregnancyPlanning Model
```prisma
model PregnancyPlanning {
  id              Int      @id @default(autoincrement())
  userId          Int
  lastPeriodDate  DateTime
  cycleLength     Int
  lifestyleGoals  String?  @db.Text
  notes           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            user     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("pregnancy_planning")
}
```

### User Model Update
Added the relation field to the user model:
```prisma
pregnancyPlannings PregnancyPlanning[]
```

## API Endpoints

### Create Pregnancy Planning
- **Method**: POST
- **URL**: `/api/v1/profile/:id/pregnancy-planning`
- **Body**:
```json
{
  "lastPeriodDate": "2025-01-01T00:00:00.000Z",
  "cycleLength": 28,
  "lifestyleGoals": "Improve diet and exercise routine",
  "notes": "Planning to start trying in 3 months"
}
```

### Get Pregnancy Planning
- **Method**: GET
- **URL**: `/api/v1/profile/:id/pregnancy-planning`

### Update Pregnancy Planning
- **Method**: PUT
- **URL**: `/api/v1/profile/:id/pregnancy-planning`
- **Body**:
```json
{
  "lastPeriodDate": "2025-01-01T00:00:00.000Z",
  "cycleLength": 30,
  "lifestyleGoals": "Updated goals",
  "notes": "Updated notes"
}
```

### Delete Pregnancy Planning
- **Method**: DELETE
- **URL**: `/api/v1/profile/:id/pregnancy-planning`

## Features

### 1. Data Validation
- **lastPeriodDate**: Required date field
- **cycleLength**: Required integer with validation (21-35 days range)
- **lifestyleGoals**: Optional text field
- **notes**: Optional text field

### 2. Calculated Fields
The API automatically calculates and returns:
- **Ovulation Date**: Estimated based on cycle length
- **Fertile Window**: 5 days before ovulation
- **Next Period Date**: Based on last period and cycle length
- **Pregnancy Probability**: Calculated based on current cycle day

### 3. Business Logic
- One pregnancy planning record per user
- Automatic calculation of fertility metrics
- Proper error handling for missing data
- Validation of cycle length (21-35 days)

## Implementation Details

### DTOs (Data Transfer Objects)
- `CreatePregnancyPlanningDto`: For creating new records
- `UpdatePregnancyPlanningDto`: For updating existing records
- `PregnancyPlanningResponseDto`: For API responses with calculated fields

### Service Methods
- `createPregnancyPlanning()`: Creates new pregnancy planning record
- `getPregnancyPlanning()`: Retrieves user's pregnancy planning data
- `updatePregnancyPlanning()`: Updates existing pregnancy planning data
- `deletePregnancyPlanning()`: Deletes pregnancy planning data
- `enrichPregnancyPlanningData()`: Adds calculated fertility metrics

### Controller Endpoints
All endpoints are implemented in `ProfileController` under the `/api/v1/profile/:id/pregnancy-planning` route.

## Testing

### Test File
A test file `test-pregnancy-planning.http` has been created with all API endpoints for easy testing.

### Test Commands
```http
### Create Pregnancy Planning
POST http://localhost:3000/api/v1/profile/1/pregnancy-planning

### Get Pregnancy Planning
GET http://localhost:3000/api/v1/profile/1/pregnancy-planning

### Update Pregnancy Planning
PUT http://localhost:3000/api/v1/profile/1/pregnancy-planning

### Delete Pregnancy Planning
DELETE http://localhost:3000/api/v1/profile/1/pregnancy-planning
```

## Database Migration
A new migration `20251006000010_add_pregnancy_planning` has been created and applied, which:
1. Creates the `pregnancy_planning` table
2. Adds proper indexes and foreign key constraints
3. Uses appropriate MySQL data types

## Integration
The feature is fully integrated with the existing:
- User module structure
- Prisma ORM setup
- Validation and error handling patterns
- API routing conventions

## Next Steps
1. Test the API endpoints using the provided test file
2. Integrate with frontend application
3. Add additional features like pregnancy tracking when user becomes pregnant
4. Consider adding notifications for fertile windows
