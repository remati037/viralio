'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AICredits {
  credits_used: number
  credits_remaining: number
  max_credits: number
  reset_at: string
  month: number
  year: number
}

const MAX_CREDITS = 500

export function useAICredits(userId: string | null) {
  const [credits, setCredits] = useState<AICredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

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
    hasCredits: credits ? credits.credits_remaining > 0 : false,
  }
}

