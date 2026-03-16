/**
 * Lead system types — V2 dashboards
 * Shared between attorney, admin, and system dashboards
 */

// ============================================================
// Core entities
// ============================================================

export interface Lead {
  id: string
  service_name: string
  city: string | null
  postal_code: string | null
  description: string
  budget: string | null
  urgency: 'normal' | 'urgent' | 'very_urgent'
  client_name: string
  client_email: string | null
  client_phone: string
  status: string
  created_at: string
}

export interface LeadAssignment {
  id: string
  lead_id: string
  attorney_id: string
  status: 'pending' | 'viewed' | 'quoted' | 'declined'
  assigned_at: string
  viewed_at: string | null
  lead: Lead
}

export interface LeadEvent {
  id: string
  lead_id: string
  attorney_id: string | null
  actor_id: string | null
  event_type: LeadEventType
  metadata: Record<string, unknown>
  created_at: string
}

export type LeadEventType =
  | 'created'
  | 'dispatched'
  | 'viewed'
  | 'quoted'
  | 'declined'
  | 'accepted'
  | 'refused'
  | 'completed'
  | 'expired'
  | 'reassigned'

// ============================================================
// Filters & pagination
// ============================================================

export type AssignmentStatusFilter = 'all' | 'pending' | 'viewed' | 'quoted' | 'declined'

export interface LeadFilters {
  status?: string
  urgency?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  attorneyId?: string
  page?: number
  pageSize?: number
}

// ============================================================
// Stats
// ============================================================

export interface ArtisanLeadStats {
  total: number
  pending: number
  viewed: number
  quoted: number
  declined: number
  accepted: number
  completed: number
  conversionRate: number
  avgResponseMinutes: number
  thisMonth: number
  lastMonth: number
  monthlyGrowth: number
}

export interface AdminLeadStats {
  totalLeads: number
  totalAssignments: number
  pendingLeads: number
  dispatchedToday: number
  conversionRate: number
  avgResponseMinutes: number
  leadsByUrgency: { normal: number; urgent: number; very_urgent: number }
  leadsByStatus: Record<string, number>
  topServices: Array<{ service: string; count: number }>
  topCities: Array<{ city: string; count: number }>
}

export interface SystemKPIs {
  leads: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
  }
  events: {
    total: number
    today: number
  }
  assignments: {
    total: number
    pending: number
    viewed: number
    quoted: number
    declined: number
  }
  providers: {
    total: number
    active: number
    withLeads: number
  }
  quality: {
    avgResponseMinutes: number
    conversionRate: number
    declineRate: number
    expiredRate: number
  }
  funnel: Array<{ stage: string; count: number; rate: number }>
}

// ============================================================
// Timeline
// ============================================================

export interface TimelineEntry {
  id: string
  event_type: LeadEventType
  metadata: Record<string, unknown>
  created_at: string
  label: string
  description: string
  color: string
  icon: string
}

// ============================================================
// Helpers
// ============================================================

export const EVENT_TYPE_META: Record<LeadEventType, { label: string; color: string; icon: string }> = {
  created: { label: 'Lead created', color: 'blue', icon: 'Plus' },
  dispatched: { label: 'Dispatched', color: 'indigo', icon: 'Send' },
  viewed: { label: 'Viewed', color: 'yellow', icon: 'Eye' },
  quoted: { label: 'Quote sent', color: 'green', icon: 'FileText' },
  declined: { label: 'Declined', color: 'gray', icon: 'X' },
  accepted: { label: 'Accepted', color: 'emerald', icon: 'Check' },
  refused: { label: 'Refused', color: 'red', icon: 'XCircle' },
  completed: { label: 'Completed', color: 'green', icon: 'CheckCircle' },
  expired: { label: 'Expired', color: 'orange', icon: 'Clock' },
  reassigned: { label: 'Reassigned', color: 'purple', icon: 'RefreshCw' },
}

export const URGENCY_META: Record<string, { label: string; cls: string }> = {
  normal: { label: 'Normal', cls: 'bg-gray-100 text-gray-700' },
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700' },
  very_urgent: { label: 'Very urgent', cls: 'bg-red-200 text-red-800' },
}

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'New', cls: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Viewed', cls: 'bg-yellow-100 text-yellow-700' },
  quoted: { label: 'Quote sent', cls: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', cls: 'bg-gray-100 text-gray-600' },
  accepted: { label: 'Accepted', cls: 'bg-emerald-100 text-emerald-700' },
  refused: { label: 'Refused', cls: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-800' },
  expired: { label: 'Expired', cls: 'bg-orange-100 text-orange-700' },
}
