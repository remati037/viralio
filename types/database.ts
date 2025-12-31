export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          business_name: string | null
          business_category: string | null
          target_audience: string | null
          persona: string | null
          monthly_goal_short: number | null
          monthly_goal_long: number | null
          role: 'admin' | 'user'
          tier: 'free' | 'pro' | 'admin'
          has_unlimited_free: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          business_name?: string | null
          business_category?: string | null
          target_audience?: string | null
          persona?: string | null
          monthly_goal_short?: number | null
          monthly_goal_long?: number | null
          role?: 'admin' | 'user'
          tier?: 'free' | 'pro' | 'admin'
          has_unlimited_free?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string | null
          business_category?: string | null
          target_audience?: string | null
          persona?: string | null
          monthly_goal_short?: number | null
          monthly_goal_long?: number | null
          role?: 'admin' | 'user'
          tier?: 'free' | 'pro' | 'admin'
          has_unlimited_free?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      social_links: {
        Row: {
          id: string
          profile_id: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          url?: string
          created_at?: string
        }
      }
      competitors: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          icon: string | null
          niche: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          icon?: string | null
          niche?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          icon?: string | null
          niche?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          niche: string
          format: 'Kratka Forma' | 'Duga Forma'
          hook: string | null
          body: string | null
          cta: string | null
          status: 'idea' | 'ready' | 'scheduled' | 'published'
          publish_date: string | null
          original_template: string | null
          cover_image_url: string | null
          result_views: string | null
          result_engagement: string | null
          result_conversions: string | null
          analysis: string | null
          created_by: string | null
          is_admin_case_study: boolean
          category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          niche: string
          format: 'Kratka Forma' | 'Duga Forma'
          hook?: string | null
          body?: string | null
          cta?: string | null
          status?: 'idea' | 'ready' | 'scheduled' | 'published'
          publish_date?: string | null
          original_template?: string | null
          cover_image_url?: string | null
          result_views?: string | null
          result_engagement?: string | null
          result_conversions?: string | null
          analysis?: string | null
          created_by?: string | null
          is_admin_case_study?: boolean
          category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          niche?: string
          format?: 'Kratka Forma' | 'Duga Forma'
          hook?: string | null
          body?: string | null
          cta?: string | null
          status?: 'idea' | 'ready' | 'scheduled' | 'published'
          publish_date?: string | null
          original_template?: string | null
          cover_image_url?: string | null
          result_views?: string | null
          result_engagement?: string | null
          result_conversions?: string | null
          analysis?: string | null
          created_by?: string | null
          is_admin_case_study?: boolean
          category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      inspiration_links: {
        Row: {
          id: string
          task_id: string
          link: string
          display_url: string | null
          type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          link: string
          display_url?: string | null
          type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          link?: string
          display_url?: string | null
          type?: string | null
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          created_by: string
          title: string
          format: 'Kratka Forma' | 'Duga Forma'
          views_potential: string | null
          concept: string | null
          structure: Json
          vlads_tip: string | null
          niche: string
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          title: string
          format: 'Kratka Forma' | 'Duga Forma'
          views_potential?: string | null
          concept?: string | null
          structure: Json
          vlads_tip?: string | null
          niche: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          title?: string
          format?: 'Kratka Forma' | 'Duga Forma'
          views_potential?: string | null
          concept?: string | null
          structure?: Json
          vlads_tip?: string | null
          niche?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      template_visibility: {
        Row: {
          id: string
          template_id: string
          tier: 'free' | 'pro' | 'admin'
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          tier: 'free' | 'pro' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          tier?: 'free' | 'pro' | 'admin'
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: string | null
          subscription_period_start: string | null
          subscription_period_end: string | null
          next_payment_date: string | null
          tier_at_payment: 'free' | 'pro' | 'admin' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          subscription_period_start?: string | null
          subscription_period_end?: string | null
          next_payment_date?: string | null
          tier_at_payment?: 'free' | 'pro' | 'admin' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          subscription_period_start?: string | null
          subscription_period_end?: string | null
          next_payment_date?: string | null
          tier_at_payment?: 'free' | 'pro' | 'admin' | null
          created_at?: string
          updated_at?: string
        }
      }
      user_statistics: {
        Row: {
          id: string
          user_id: string
          total_tasks: number
          published_tasks: number
          total_views: string
          total_engagement: string
          total_conversions: string
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_tasks?: number
          published_tasks?: number
          total_views?: string
          total_engagement?: string
          total_conversions?: string
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_tasks?: number
          published_tasks?: number
          total_views?: string
          total_engagement?: string
          total_conversions?: string
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_credits: {
        Row: {
          id: string
          user_id: string
          credits_used: number
          month: number
          year: number
          reset_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_used?: number
          month: number
          year: number
          reset_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits_used?: number
          month?: number
          year?: number
          reset_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

