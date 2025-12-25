'use client'

import { useProfile } from '@/lib/hooks/useProfile'
import { useTasks } from '@/lib/hooks/useTasks'
import { useUserId } from '@/components/UserContext'
import CaseStudyView from '@/components/CaseStudyView'
import CaseStudyDetailModal from '@/components/CaseStudyDetailModal'
import { useState } from 'react'
import type { Task, UserTier } from '@/types'

export default function CaseStudyPage() {
  const userId = useUserId()
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<Task | null>(null)
  const { tasks } = useTasks(userId)
  const { profile } = useProfile(userId)

  return (
    <>
      <CaseStudyView
        tasks={tasks}
        onCaseStudyClick={setSelectedCaseStudy}
        userId={userId}
        userTier={profile?.tier as UserTier | undefined}
      />

      {selectedCaseStudy && (
        <CaseStudyDetailModal task={selectedCaseStudy} onClose={() => setSelectedCaseStudy(null)} />
      )}
    </>
  )
}

