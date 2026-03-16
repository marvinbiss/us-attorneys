// Types pour l'administration

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'viewer'

export interface AdminPermissions {
  users: { read: boolean; write: boolean; delete: boolean }
  providers: { read: boolean; write: boolean; delete: boolean; verify: boolean }
  reviews: { read: boolean; write: boolean; delete: boolean }
  payments: { read: boolean; refund: boolean; cancel: boolean }
  services: { read: boolean; write: boolean; delete: boolean }
  settings: { read: boolean; write: boolean }
  audit: { read: boolean }
  prospection: { read: boolean; write: boolean; send: boolean; ai: boolean }
  content: { read: boolean; write: boolean; delete: boolean; publish: boolean }
}

export interface AdminUser {
  id: string
  user_id: string
  email: string
  role: AdminRole
  permissions: AdminPermissions
  created_at: string
  updated_at?: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: 'user' | 'provider' | 'review' | 'payment' | 'service' | 'settings' | 'booking' | 'cms_page'
  resource_id?: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface UserReport {
  id: string
  reporter_id?: string
  reporter_email?: string
  target_type: 'provider' | 'review' | 'user' | 'message'
  target_id: string
  reason: 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other'
  description?: string
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed'
  reviewed_by?: string
  resolution?: string
  created_at: string
  reviewed_at?: string
}

export interface GdprRequest {
  id: string
  user_id?: string
  user_email: string
  request_type: 'export' | 'delete'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_by?: string
  notes?: string
  created_at: string
  processed_at?: string
}

// User management
export interface AdminUserView {
  id: string
  email: string
  full_name?: string
  phone?: string
  user_type: 'client' | 'attorney'
  is_verified: boolean
  is_banned: boolean
  ban_reason?: string
  subscription_plan: 'free' | 'pro' | 'premium'
  subscription_status?: 'active' | 'canceled' | 'past_due'
  stripe_customer_id?: string
  created_at: string
  updated_at?: string
  last_login?: string
}

// Pagination
export interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationState
}

// Filters
export interface AdminFilters {
  search?: string
  status?: string
  type?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Payment types
export interface PaymentRecord {
  id: string
  user_id: string
  user_email: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  type: 'subscription' | 'booking' | 'manual'
  stripe_payment_id?: string
  description?: string
  created_at: string
  refunded_at?: string
  refund_amount?: number
}

export interface SubscriptionRecord {
  id: string
  user_id: string
  user_email: string
  user_name?: string
  plan: 'free' | 'pro' | 'premium'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  stripe_subscription_id?: string
  current_period_start?: string
  current_period_end?: string
  amount: number
  created_at: string
  canceled_at?: string
}

// Booking types for admin
export interface AdminBooking {
  id: string
  attorney_id: string
  provider_name?: string
  client_email: string
  client_name?: string
  service: string
  booking_date: string
  time_slot: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_status: 'not_required' | 'pending' | 'paid'
  deposit_amount?: number
  created_at: string
  cancelled_at?: string
  cancellation_reason?: string
}

// Quote/Devis types for admin
export interface AdminQuote {
  id: string
  client_email: string
  client_name?: string
  client_phone?: string
  service_name: string
  description?: string
  postal_code: string
  status: 'pending' | 'sent' | 'accepted' | 'refused' | 'expired'
  urgency: 'normal' | 'urgent' | 'very_urgent'
  created_at: string
  updated_at?: string
}

// Message/Conversation for admin
export interface AdminConversation {
  id: string
  client_id: string
  client_email?: string
  attorney_id: string
  provider_name?: string
  status: 'active' | 'archived' | 'blocked'
  last_message_at?: string
  unread_count: number
  created_at: string
}

export interface AdminMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'client' | 'attorney' | 'system'
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  created_at: string
  read_at?: string
}

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    users: { read: true, write: true, delete: true },
    providers: { read: true, write: true, delete: true, verify: true },
    reviews: { read: true, write: true, delete: true },
    payments: { read: true, refund: true, cancel: true },
    services: { read: true, write: true, delete: true },
    settings: { read: true, write: true },
    audit: { read: true },
    prospection: { read: true, write: true, send: true, ai: true },
    content: { read: true, write: true, delete: true, publish: true },
  },
  admin: {
    users: { read: true, write: true, delete: false },
    providers: { read: true, write: true, delete: false, verify: true },
    reviews: { read: true, write: true, delete: true },
    payments: { read: true, refund: true, cancel: false },
    services: { read: true, write: true, delete: false },
    settings: { read: true, write: false },
    audit: { read: true },
    prospection: { read: true, write: true, send: true, ai: true },
    content: { read: true, write: true, delete: false, publish: true },
  },
  moderator: {
    users: { read: true, write: false, delete: false },
    providers: { read: true, write: false, delete: false, verify: true },
    reviews: { read: true, write: true, delete: false },
    payments: { read: true, refund: false, cancel: false },
    services: { read: true, write: false, delete: false },
    settings: { read: false, write: false },
    audit: { read: false },
    prospection: { read: true, write: false, send: false, ai: false },
    content: { read: true, write: true, delete: false, publish: false },
  },
  viewer: {
    users: { read: true, write: false, delete: false },
    providers: { read: true, write: false, delete: false, verify: false },
    reviews: { read: true, write: false, delete: false },
    payments: { read: true, refund: false, cancel: false },
    services: { read: true, write: false, delete: false },
    settings: { read: false, write: false },
    audit: { read: false },
    prospection: { read: false, write: false, send: false, ai: false },
    content: { read: true, write: false, delete: false, publish: false },
  },
}

// ============================================
// ADDITIONAL TYPES
// ============================================

// Service/Category types
export interface AdminService {
  id: string
  name: string
  slug: string
  description?: string
  category_id: string
  category_name?: string
  icon?: string
  image?: string
  is_active: boolean
  attorney_count?: number
  booking_count?: number
  created_at: string
  updated_at?: string
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  image?: string
  is_active: boolean
  service_count?: number
  display_order: number
  created_at: string
  updated_at?: string
}

// Dashboard stats
export interface DashboardStats {
  users: {
    total: number
    active: number
    newThisMonth: number
    growthPercent: number
  }
  providers: {
    total: number
    verified: number
    pending: number
    newThisMonth: number
  }
  bookings: {
    total: number
    thisMonth: number
    completed: number
    canceled: number
  }
  revenue: {
    total: number
    thisMonth: number
    growthPercent: number
    avgPerProvider: number
  }
  reviews: {
    total: number
    avgRating: number
    pending: number
    flagged: number
  }
}

// Time series for charts
export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

// Bulk action result
export interface BulkActionResult {
  success: number
  failed: number
  errors: Array<{
    id: string
    error: string
  }>
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
}

// Provider verification details
export interface ProviderVerification {
  siret: string
  siretValid: boolean
  siretVerified: boolean
  siretVerifiedAt?: string
  companyName?: string
  trustBadge?: 'gold' | 'silver' | 'bronze' | 'none'
  healthScore?: number
  pappersData?: Record<string, unknown>
}

// Call/Lead tracking
export interface AdminCall {
  id: string
  call_sid: string
  from_number: string
  to_number: string
  attorney_id?: string
  artisan_name?: string
  direction: 'inbound' | 'outbound'
  status: 'ringing' | 'in-progress' | 'completed' | 'busy' | 'no-answer' | 'failed'
  duration: number
  is_lead: boolean
  lead_charged: boolean
  lead_amount?: number
  recording_url?: string
  created_at: string
}

// Notification/Email log
export interface AdminNotification {
  id: string
  user_id: string
  user_email: string
  type: 'email' | 'sms' | 'push'
  template: string
  subject?: string
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  sent_at?: string
  error?: string
  created_at: string
}

// Settings
export interface PlatformSettings {
  siteName: string
  siteUrl: string
  supportEmail: string
  maintenanceMode: boolean
  allowRegistration: boolean
  requireEmailVerification: boolean
  defaultSubscriptionPlan: string
  leadPrice: number
  commissionRate: number
  trialDays: number
}

// Export helper types
export type SortOrder = 'asc' | 'desc'
export type EntityType = 'user' | 'provider' | 'review' | 'payment' | 'service' | 'booking' | 'quote' | 'report'
