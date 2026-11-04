export interface RecentVisitSummary {
  id: string
  number: string
  partner_id: string
  partner_name: string
  total: number
  status: 'unpaid' | 'partial' | 'paid'
  visited_at: string
}

export interface PriorityPartnerSummary {
  id: string
  name: string
  owner_name: string
  whatsapp: string
  receivable: number
  last_visit?: string | null
}

export interface DashboardData {
  date: string
  receivable: number
  paid_today: number
  visits_today: number
  unpaid_invoices: number
  active_partners: number
  recent_visits: RecentVisitSummary[]
  priority_partners: PriorityPartnerSummary[]
}

export interface PartnerRecord {
  id: string
  name: string
  owner_name: string
  whatsapp: string
  address?: string | null
  is_active: boolean
  receivable: number
  created_at: string
  updated_at: string
}
