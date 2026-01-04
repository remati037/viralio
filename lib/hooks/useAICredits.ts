'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export interface AICredits {
  credits_used: number
  credits_remaining: number
  max_credits: number
  reset_at: string
  month: number
  year: number
}

export interface UseAICreditsReturn {
  credits: AICredits | null
  loading: boolean
  error: string | null
  refreshCredits: () => void
  updateCreditsFromResponse: (apiCredits: {
    used: number
    remaining: number
    max: number
    reset_at?: string
  }) => void
  hasCredits: boolean
}

const MAX_CREDITS = 500

export function useAICredits(userId: string | null): UseAICreditsReturn {
  const [credits, setCredits] = useState<AICredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Update credits from API response
  const updateCreditsFromResponse = (apiCredits: {
    used: number
    remaining: number
    max: number
    reset_at?: string
  }): void => {
    if (!userId) {
      console.warn('updateCreditsFromResponse called without userId');
      return;
    }

    console.log('updateCreditsFromResponse called with:', apiCredits);
    console.log('Current credits state before update:', credits);

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Use reset_at from API if provided, otherwise calculate it
    const resetAt = apiCredits.reset_at || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()

    const newCredits: AICredits = {
      credits_used: apiCredits.used,
      credits_remaining: apiCredits.remaining,
      max_credits: apiCredits.max,
      reset_at: resetAt,
      month: currentMonth,
      year: currentYear,
    };

    console.log('Setting credits to:', newCredits);
    // Use functional update to ensure we're working with latest state
    setCredits((prev) => {
      console.log('setCredits callback - prev:', prev, 'new:', newCredits);
      return newCredits;
    });
  }

  const fetchCredits = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const { data, error: fetchError } = await supabase
        .from('ai_credits')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = not found, which is okay (means 0 credits used)
        throw fetchError
      }

      if (data) {
        setCredits({
          credits_used: data.credits_used || 0,
          credits_remaining: MAX_CREDITS - (data.credits_used || 0),
          max_credits: MAX_CREDITS,
          reset_at: data.reset_at,
          month: data.month,
          year: data.year,
        })
      } else {
        // No record yet, user hasn't used any credits
        setCredits({
          credits_used: 0,
          credits_remaining: MAX_CREDITS,
          max_credits: MAX_CREDITS,
          reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
          month: currentMonth,
          year: currentYear,
        })
      }
      setError(null)
    } catch (err: any) {
      console.error('Error fetching AI credits:', err)
      setError(err.message)
      // Set default values on error
      setCredits({
        credits_used: 0,
        credits_remaining: MAX_CREDITS,
        max_credits: MAX_CREDITS,
        reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredits()

    // Refresh credits every 30 seconds to keep them up to date
    const interval = setInterval(() => {
      fetchCredits()
    }, 30000)

    return () => clearInterval(interval)
  }, [userId])

  const refreshCredits = () => {
    fetchCredits()
  }

  return {
    credits,
    loading,
    error,
    refreshCredits,
    updateCreditsFromResponse,
    hasCredits: credits ? credits.credits_remaining > 0 : false,
  }
}

