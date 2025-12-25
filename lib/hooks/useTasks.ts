'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskInsert, TaskUpdate, InspirationLink } from '@/types'

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
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

    async function fetchTasks() {
      try {
        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('*, inspiration_links(*), category:task_categories(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setTasks((data || []) as Task[])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [userId, supabase])

  const createTask = async (task: TaskInsert) => {
    if (!userId) return { data: null, error: 'User not authenticated' }

    try {
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: userId })
        .select('*, inspiration_links(*), category:task_categories(*)')
        .single()

      if (insertError) throw insertError

      setTasks((prev) => [data as Task, ...prev])
      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  const updateTask = async (taskId: string, updates: TaskUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select('*, inspiration_links(*), category:task_categories(*)')
        .single()

      if (updateError) throw updateError

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? (data as Task) : task))
      )

      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (deleteError) throw deleteError

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      return { error: null }
    } catch (err: any) {
      setError(err.message)
      return { error: err.message }
    }
  }

  const addInspirationLink = async (taskId: string, link: string, displayUrl?: string, type?: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('inspiration_links')
        .insert({ task_id: taskId, link, display_url: displayUrl, type })
        .select()
        .single()

      if (insertError) throw insertError

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                inspiration_links: [...(task.inspiration_links || []), data as InspirationLink],
              }
            : task
        )
      )

      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  const removeInspirationLink = async (linkId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('inspiration_links')
        .delete()
        .eq('id', linkId)

      if (deleteError) throw deleteError

      setTasks((prev) =>
        prev.map((task) => ({
          ...task,
          inspiration_links: task.inspiration_links?.filter((link) => link.id !== linkId) || [],
        }))
      )

      return { error: null }
    } catch (err: any) {
      setError(err.message)
      return { error: err.message }
    }
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    addInspirationLink,
    removeInspirationLink,
  }
}

