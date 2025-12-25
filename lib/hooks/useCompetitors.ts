'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Competitor } from '@/types'

export function useCompetitors(userId: string | null) {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(false) // Start as false to avoid hydration mismatch
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    // Set loading to true only on client after mount
    setLoading(true)

    async function fetchCompetitors() {
      try {
        const { data, error: fetchError } = await supabase
          .from('competitors')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setCompetitors((data || []) as Competitor[])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitors()
  }, [userId, supabase])

  const createCompetitor = async (competitor: Omit<Competitor, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return { data: null, error: 'User not authenticated' }

    try {
      const { data, error: insertError } = await supabase
        .from('competitors')
        .insert({ ...competitor, user_id: userId })
        .select()
        .single()

      if (insertError) throw insertError

      setCompetitors((prev) => [data as Competitor, ...prev])
      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  const updateCompetitor = async (competitorId: string, updates: Partial<Competitor>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('competitors')
        .update(updates)
        .eq('id', competitorId)
        .select()
        .single()

      if (updateError) throw updateError

      setCompetitors((prev) =>
        prev.map((comp) => (comp.id === competitorId ? (data as Competitor) : comp))
      )

      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  const deleteCompetitor = async (competitorId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('competitors')
        .delete()
        .eq('id', competitorId)

      if (deleteError) throw deleteError

      setCompetitors((prev) => prev.filter((comp) => comp.id !== competitorId))
      return { error: null }
    } catch (err: any) {
      setError(err.message)
      return { error: err.message }
    }
  }

  return {
    competitors,
    loading,
    error,
    createCompetitor,
    updateCompetitor,
    deleteCompetitor,
  }
}

