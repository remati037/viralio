import type { UserTier } from '@/types'

export interface TierLimits {
  maxTasks: number | null // null = unlimited
  maxTemplates: number | null
  maxCaseStudies: number | null
  canUseCalendar: boolean
  canUseKanban: boolean
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    maxTasks: 5,
    maxTemplates: 2,
    maxCaseStudies: 2,
    canUseCalendar: false,
    canUseKanban: true,
  },
  starter: {
    maxTasks: 50,
    maxTemplates: 5,
    maxCaseStudies: null, // unlimited
    canUseCalendar: true,
    canUseKanban: true,
  },
  pro: {
    maxTasks: null, // unlimited
    maxTemplates: null, // unlimited
    maxCaseStudies: null, // unlimited
    canUseCalendar: true,
    canUseKanban: true,
  },
}

export function getTierLimits(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier]
}

export function canCreateTask(tier: UserTier, currentTaskCount: number): boolean {
  const limits = getTierLimits(tier)
  if (limits.maxTasks === null) return true
  return currentTaskCount < limits.maxTasks
}

export function getRemainingTasks(tier: UserTier, currentTaskCount: number): number | null {
  const limits = getTierLimits(tier)
  if (limits.maxTasks === null) return null
  return Math.max(0, limits.maxTasks - currentTaskCount)
}

export function canViewTemplate(tier: UserTier, templateIndex: number, visibleTemplates: number): boolean {
  const limits = getTierLimits(tier)
  if (limits.maxTemplates === null) return true
  return templateIndex < limits.maxTemplates && visibleTemplates <= limits.maxTemplates
}

export function canViewCaseStudy(tier: UserTier, caseStudyIndex: number, visibleCaseStudies: number): boolean {
  const limits = getTierLimits(tier)
  if (limits.maxCaseStudies === null) return true
  return caseStudyIndex < limits.maxCaseStudies && visibleCaseStudies <= limits.maxCaseStudies
}

export function canUseView(tier: UserTier, view: 'kanban' | 'calendar'): boolean {
  const limits = getTierLimits(tier)
  if (view === 'kanban') return limits.canUseKanban
  if (view === 'calendar') return limits.canUseCalendar
  return false
}

