'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, SocialLink } from '@/types'

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null)
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

    async function fetchProfile() {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*, social_links(*)')
          .eq('id', userId)
          .single()

        if (fetchError) throw fetchError

        setProfile(data as Profile)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, supabase])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data as Profile)
      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  const addSocialLink = async (url: string) => {
    if (!userId) return

    try {
      const { data, error: insertError } = await supabase
        .from('social_links')
        .insert({ profile_id: userId, url })
        .select()
        .single()

      if (insertError) throw insertError

      setProfile((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          social_links: [...(prev.social_links || []), data as SocialLink],
        }
      })

      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  const removeSocialLink = async (linkId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('social_links')
        .delete()
        .eq('id', linkId)

      if (deleteError) throw deleteError

      setProfile((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          social_links: prev.social_links?.filter((link) => link.id !== linkId) || [],
        }
      })

      return { error: null }
    } catch (err: any) {
      setError(err.message)
      return { error: err.message }
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    addSocialLink,
    removeSocialLink,
  }
}

