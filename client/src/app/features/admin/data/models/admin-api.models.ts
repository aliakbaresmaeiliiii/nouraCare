export interface ApiEnvelope<T> {
  isSuccess: boolean;
  message?: string;
  data?: T;
  code?: number;
}

export interface AdminOverviewDto {
  users: {
    total: number;
    active: number;
    suspended: number;
    verified: number;
    admins: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    byStatus: Record<string, number>;
  };
  subscriptions: {
    byTier: Record<string, number>;
  };
  reproductive: {
    byState: Record<string, number>;
  };
  doctors: {
    total: number;
    verified: number;
    unverified: number;
  };
  appointments: {
    total: number;
    pending: number;
  };
  community: {
    threads: number;
    posts: number;
    secretChats: number;
  };
  charts: {
    signupsLast7Days: Array<{ day: string; count: number }>;
  };
  recentSignups: Array<{
    id: number;
    fullName: string | null;
    email: string | null;
    status: string;
    createdAt: string;
    isVerified: boolean;
  }>;
}

export interface AdminApiUser {
  id: number;
  email: string | null;
  phoneNumber: string | null;
  fullName: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  dateOfBirth?: string | null;
  user_subscription?: {
    tier: string;
    premiumUntil?: string | null;
    trialEndsAt?: string | null;
    billingInterval?: string | null;
  } | null;
  user_engagement?: {
    engagementScore?: number | null;
    engagementTier?: string | null;
    lastOpenAt?: string | null;
    growthPoints?: number | null;
  } | null;
  user_profile?: {
    bio?: string | null;
    avatarUrl?: string | null;
    profileImage?: string | null;
  } | null;
  reproductive?: {
    state?: string | null;
    updatedAt?: string | null;
  } | null;
  _count?: {
    forum_threads?: number;
    forum_posts?: number;
    forum_comments?: number;
    doctor_appointments?: number;
  };
}

export interface AdminUserUpdateBody {
  status?: string;
  role?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  isVerified?: boolean;
}

export interface AdminUserCreateBody {
  fullName: string;
  email: string;
  phoneNumber: string;
  role?: string;
  status?: string;
}

export interface AdminUsersPageDto {
  items: AdminApiUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminSubscriptionSummaryDto {
  byTier: Record<string, number>;
  premiumActive: number;
  trialActive: number;
}

export interface AdminHealthDto {
  status: 'healthy' | 'degraded' | 'down';
  database: 'up' | 'down';
  latencyMs?: number;
  uptimeSec: number;
  checkedAt: string;
}

export interface AdminMeDto {
  id: number;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

export type AdminTicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_ON_USER'
  | 'RESOLVED'
  | 'CLOSED';

export type AdminTicketCategory =
  | 'BUG'
  | 'QUESTION'
  | 'ACCOUNT'
  | 'PAYMENT'
  | 'FEEDBACK'
  | 'OTHER';

export interface AdminTicketUser {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  status?: string;
  role?: string;
}

export interface AdminTicketMessage {
  id: string;
  authorId: number;
  authorRole: 'USER' | 'ADMIN';
  body: string;
  createdAt: string;
}

export interface AdminTicketListItem {
  id: string;
  subject: string;
  category: AdminTicketCategory;
  status: AdminTicketStatus;
  priority: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  assignedAdminId: number | null;
  messageCount: number;
  user: AdminTicketUser;
  preview: {
    body: string;
    authorRole: 'USER' | 'ADMIN';
    createdAt: string;
  } | null;
}

export interface AdminTicketsPageDto {
  items: AdminTicketListItem[];
  total: number;
  openCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminTicketDetail extends Omit<AdminTicketListItem, 'preview'> {
  appVersion?: string | null;
  deviceInfo?: string | null;
  pagePath?: string | null;
  messages: AdminTicketMessage[];
}

export interface AdminTicketUpdateBody {
  status?: AdminTicketStatus;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  assignedAdminId?: number;
}

export type AdminDoctorConsultationType = 'ONLINE' | 'IN_PERSON' | 'BOTH';
export type AdminAppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type AdminAppointmentConsultationType = 'ONLINE' | 'IN_PERSON';

export interface AdminApiDoctor {
  id: string;
  fullName: string;
  specialty: string;
  experienceYears: number;
  about: string;
  rating: number;
  profileImageUrl: string | null;
  clinicName: string | null;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  consultationType: AdminDoctorConsultationType;
  fee: number | null;
  licenseNumber: string | null;
  licenseDocument?: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    doctor_appointments?: number;
  };
}

export interface AdminDoctorAppointmentSummary {
  id: string;
  status: AdminAppointmentStatus;
  consultationType: AdminAppointmentConsultationType;
  scheduledAt: string;
  feeTomans: number | null;
  createdAt: string;
  cancelledAt: string | null;
  user: {
    id: number;
    fullName: string | null;
    email: string | null;
  };
}

export interface AdminDoctorDetail extends AdminApiDoctor {
  appointmentStats: {
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  recentAppointments: AdminDoctorAppointmentSummary[];
}

export interface AdminDoctorCreateBody {
  fullName: string;
  specialty: string;
  experienceYears: number;
  about: string;
  rating?: number;
  profileImageUrl?: string;
  clinicName?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  consultationType: AdminDoctorConsultationType;
  fee?: number;
  licenseNumber?: string;
  isVerified?: boolean;
}

export interface AdminDoctorUpdateBody {
  fullName?: string;
  specialty?: string;
  experienceYears?: number;
  about?: string;
  rating?: number;
  profileImageUrl?: string | null;
  clinicName?: string | null;
  location?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  consultationType?: AdminDoctorConsultationType;
  fee?: number | null;
  licenseNumber?: string | null;
  isVerified?: boolean;
}

export interface AdminDoctorsPageDto {
  items: AdminApiDoctor[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  verifiedCount: number;
  unverifiedCount: number;
}

export interface AdminAppointmentItem {
  id: string;
  status: AdminAppointmentStatus;
  consultationType: AdminAppointmentConsultationType;
  scheduledAt: string;
  slotKey: string;
  feeTomans: number | null;
  createdAt: string;
  cancelledAt: string | null;
  doctor: {
    id: string;
    fullName: string;
    specialty: string;
  };
  user: {
    id: number;
    fullName: string | null;
    email: string | null;
    phoneNumber?: string | null;
  };
}

export interface AdminAppointmentsPageDto {
  items: AdminAppointmentItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  pendingCount: number;
  confirmedCount: number;
  cancelledCount: number;
}

export interface AdminAppointmentUpdateBody {
  status: AdminAppointmentStatus;
}
