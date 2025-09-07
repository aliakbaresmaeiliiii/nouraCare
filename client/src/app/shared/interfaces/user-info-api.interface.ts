/**
 * API Interface for User Info Service
 * This file documents the expected API structure for server-side implementation
 */

export interface UserInfoApiResponse {
  success: boolean;
  data: UserInfo;
  message?: string;
}

export interface UserInfo {
  id: number;
  userId: number;
  pregnancyStatus: 'pregnant' | 'trying' | 'postpartum' | 'tracking';
  lastPeriodDate: string | null;
  cycleLength: number;
  periodLength: number;
  pregnancyWeek?: number;
  pregnancyProgress?: number;
  healthGoals: string[];
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInfoRequest {
  userId: number;
  pregnancyStatus: 'pregnant' | 'trying' | 'postpartum' | 'tracking';
  lastPeriodDate: string | null;
  cycleLength: number;
  periodLength: number;
  pregnancyWeek?: number;
  pregnancyProgress?: number;
  healthGoals: string[];
  notificationsEnabled: boolean;
}

export interface UpdateUserInfoRequest {
  id: number;
  pregnancyStatus?: 'pregnant' | 'trying' | 'postpartum' | 'tracking';
  lastPeriodDate?: string | null;
  cycleLength?: number;
  periodLength?: number;
  pregnancyWeek?: number;
  pregnancyProgress?: number;
  healthGoals?: string[];
  notificationsEnabled?: boolean;
}

/**
 * Expected API Endpoints:
 * 
 * POST /api/user-info
 * - Create new user info record
 * - Body: CreateUserInfoRequest
 * - Response: UserInfoApiResponse
 * 
 * GET /api/user-info/:userId
 * - Get user info by user ID
 * - Response: UserInfoApiResponse
 * 
 * PUT /api/user-info/:id
 * - Update existing user info record
 * - Body: UpdateUserInfoRequest
 * - Response: UserInfoApiResponse
 * 
 * DELETE /api/user-info/:id
 * - Delete user info record
 * - Response: { success: boolean, message: string }
 */

/**
 * Database Table Structure (Suggested):
 * 
 * CREATE TABLE user_info (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   user_id INT NOT NULL,
 *   pregnancy_status ENUM('pregnant', 'trying', 'postpartum', 'tracking') NOT NULL,
 *   last_period_date DATE NULL,
 *   cycle_length INT NOT NULL DEFAULT 28,
 *   period_length INT NOT NULL DEFAULT 5,
 *   pregnancy_week INT NULL,
 *   pregnancy_progress DECIMAL(5,2) NULL,
 *   health_goals JSON NULL,
 *   notifications_enabled BOOLEAN NOT NULL DEFAULT true,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 *   UNIQUE KEY unique_user_info (user_id)
 * );
 */
