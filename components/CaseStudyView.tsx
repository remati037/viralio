'use client'

import { createClient } from '@/lib/supabase/client'
import { seedMockCaseStudies } from '@/lib/utils/mockCaseStudies'
import { getTierLimits } from '@/lib/utils/tierRestrictions'
import type { Task, UserTier } from '@/types'
import { ClipboardList, Eye, Heart, Lightbulb, Plus, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import Loader from './ui/loader'
import Skeleton from './ui/skeleton'

interface CaseStudyViewProps {
  tasks: Task[]
  onCaseStudyClick: (task: Task) => void
  userId: string
  userTier?: UserTier
}

export default function CaseStudyView({ tasks, onCaseStudyClick, userId, userTier }: CaseStudyViewProps) {
  const [adminCaseStudies, setAdminCaseStudies] = useState<Task[]>([])
  const [loadingCaseStudies, setLoadingCaseStudies] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const supabase = createClient()

  // Fetch all admin case studies
  useEffect(() => {
    async function fetchAdminCaseStudies() {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*, inspiration_links(*), category:task_categories(*)')
          .eq('is_admin_case_study', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setAdminCaseStudies((data || []) as Task[])
      } catch (error: any) {
        console.error('Error fetching admin case studies:', error)
        toast.error('Greška pri učitavanju studija slučaja', {
          description: error.message,
        })
      } finally {
        setLoadingCaseStudies(false)
      }
    }

    fetchAdminCaseStudies()
  }, [supabase])

  // Store shuffled case studies in state to maintain consistency
  const [shuffledCaseStudies, setShuffledCaseStudies] = useState<Task[]>([])

  // Shuffle case studies once when they're loaded or changed
  useEffect(() => {
    if (adminCaseStudies.length === 0) {
      setShuffledCaseStudies([])
      return
    }

    // Helper function to shuffle array using Fisher-Yates algorithm
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    const shuffled = shuffleArray(adminCaseStudies)
    setShuffledCaseStudies(shuffled)
  }, [adminCaseStudies]) // Reshuffle when case studies array changes

  // Apply tier-based limits to admin case studies with stable random selection
  const visibleCaseStudies = useMemo(() => {
    if (!userTier) return shuffledCaseStudies.length > 0 ? shuffledCaseStudies : adminCaseStudies
    
    const limits = getTierLimits(userTier)
    if (limits.maxCaseStudies === null) {
      // Pro and Admin: show all
      return adminCaseStudies
    } else {
      // Free: show random 2 (or all if less than 2 available)
      if (shuffledCaseStudies.length <= limits.maxCaseStudies) {
        return shuffledCaseStudies
      }
      // Take the first N from the pre-shuffled array
      return shuffledCaseStudies.slice(0, limits.maxCaseStudies)
    }
  }, [adminCaseStudies, shuffledCaseStudies, userTier])

  const handleSeedMockData = async () => {
    setIsSeeding(true)
    try {
      const result = await seedMockCaseStudies(userId, supabase)
      if (result.error) {
        toast.error('Greška pri dodavanju mock podataka', {
          description: result.error.message,
        })
      } else {
        toast.success('Mock podaci dodati!', {
          description: '3 studije slučaja su dodate. Osvežite stranicu da ih vidite.',
        })
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error: any) {
      toast.error('Greška', {
        description: error.message,
      })
    } finally {
      setIsSeeding(false)
    }
  }

  // Helper function to strip HTML and get plain text preview
  const getPlainTextPreview = (html: string | null, maxLength: number = 150) => {
    if (!html) return 'Nema dodate analize zašto je ovaj video prošao viralno.'
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const text = tempDiv.textContent || tempDiv.innerText || ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <>
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ClipboardList className="text-emerald-400" size={24} /> Studije Slučaja
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Analizirane objave koje su ostvarile najbolje rezultate. Kliknite na karticu za detaljnu analizu.
          </p>
        </div>
      </header>

      <div className="space-y-8">
        {loadingCaseStudies ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton height={200} />
                  <div className="md:col-span-2 space-y-4">
                    <Skeleton height={30} width="80%" />
                    <Skeleton height={20} width="60%" />
                    <Skeleton height={60} />
                    <div className="flex gap-4">
                      <Skeleton height={20} width="80px" />
                      <Skeleton height={20} width="80px" />
                      <Skeleton height={20} width="80px" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visibleCaseStudies.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500">
              Još uvek nema objavljenih studija slučaja. Admin može kreirati nove studije slučaja.
            </p>
          </div>
        ) : (
          visibleCaseStudies.map((task) => (
            <div
              key={task.id}
              onClick={() => onCaseStudyClick(task)}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="w-full bg-slate-800 rounded-xl overflow-hidden aspect-video border border-slate-700 flex items-center justify-center relative">
                    {task.cover_image_url ? (
                      <img
                        src={task.cover_image_url}
                        alt="Video Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ; (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-slate-500 text-sm">Cover Slika</span>
                    )}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] rounded-full font-bold ${task.format === 'Kratka Forma' ? 'bg-red-900/70 text-red-300' : 'bg-green-900/70 text-green-300'
                        } backdrop-blur-sm`}
                    >
                      {task.format}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h2 className="text-xl font-bold text-white mb-1">{task.title}</h2>
                  <p className="text-xs text-slate-500 mb-3">
                    {task.category ? (
                      <span
                        className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded mr-2"
                        style={{
                          color: task.category.color,
                          backgroundColor: `${task.category.color}20`,
                          border: `1px solid ${task.category.color}40`,
                        }}
                      >
                        {task.category.name}
                      </span>
                    ) : null}
                    Šablon: {task.original_template || 'N/A'}
                  </p>

                  <h3 className="text-md font-bold text-slate-300 mb-2 flex items-center gap-2">
                    <Lightbulb size={16} className="text-blue-400" /> Ključna Analiza:
                  </h3>
                  <p className="text-slate-400 text-sm italic line-clamp-3">
                    {getPlainTextPreview(task.analysis)}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <Eye size={14} /> <span>{task.result_views || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-purple-400">
                      <Heart size={14} /> <span>{task.result_engagement || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <Target size={14} /> <span>{task.result_conversions || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

