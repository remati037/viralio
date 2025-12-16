import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  social_links?: SocialLink[]
  statistics?: UserStatistics
  payments?: Payment[]
}

export type SocialLink = Database['public']['Tables']['social_links']['Row']

export type Competitor = Database['public']['Tables']['competitors']['Row'] & {
  feed?: CompetitorFeed[]
}

export type CompetitorFeed = {
  id: string
  title: string
  views: string
  date: string
  type: 'reel' | 'youtube'
}

export type InspirationLink = Database['public']['Tables']['inspiration_links']['Row']

export type Task = Database['public']['Tables']['tasks']['Row'] & {
  inspiration_links?: InspirationLink[]
}

export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type Niche = {
  id: string
  name: string
  icon: any
  color: string
}

export type Network = {
  id: string
  name: string
  icon: any
  color: string
}

export type ViralTemplate = {
  id: string
  title: string
  format: string
  difficulty: string
  views_potential: string
  why_it_works: string
  structure: {
    hook: string
    body: string
    cta: string
  }
  vlads_tip: string
}

export type Template = Database['public']['Tables']['templates']['Row'] & {
  visibility?: TemplateVisibility[]
}

export type TemplateVisibility = Database['public']['Tables']['template_visibility']['Row']

export type Payment = Database['public']['Tables']['payments']['Row']

export type UserStatistics = Database['public']['Tables']['user_statistics']['Row']

export type UserRole = 'admin' | 'user'
export type UserTier = 'free' | 'starter' | 'pro'

