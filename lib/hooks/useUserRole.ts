'use client'

import { useProfile } from './useProfile'
import { useMemo } from 'react'

export type UserRole = 'admin' | 'user'
export type UserTier = 'free' | 'pro' | 'admin'

export interface UserRoleInfo {
  role: UserRole
  tier: UserTier
  isAdmin: boolean
  isPro: boolean
  isFree: boolean
}

/**
 * Hook to check user role and tier
 * Returns role information and helper functions
 */
export function useUserRole(userId: string | null): {
  roleInfo: UserRoleInfo | null
  loading: boolean
  hasRole: (role: UserRole) => boolean
  hasTier: (tier: UserTier) => boolean
  isUserAvailable: (role: UserRole) => boolean
} {
  const { profile, loading } = useProfile(userId)

  const roleInfo = useMemo<UserRoleInfo | null>(() => {
    if (!profile) return null

    const role = (profile.role || 'user') as UserRole
    const tier = (profile.tier || 'free') as UserTier

    return {
      role,
      tier,
      isAdmin: role === 'admin' || tier === 'admin',
      isPro: tier === 'pro',
      isFree: tier === 'free',
    }
  }, [profile])

  const hasRole = (role: UserRole): boolean => {
    if (!roleInfo) return false
    return roleInfo.role === role || (role === 'admin' && roleInfo.isAdmin)
  }

  const hasTier = (tier: UserTier): boolean => {
    if (!roleInfo) return false
    return roleInfo.tier === tier
  }

  const isUserAvailable = (role: UserRole): boolean => {
    return hasRole(role)
  }

  return {
    roleInfo,
    loading,
    hasRole,
    hasTier,
    isUserAvailable,
  }
}

