'use client'

import { createContext, useContext } from 'react'

const UserContext = createContext<{ userId: string } | null>(null)

export function UserProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  return <UserContext.Provider value={{ userId }}>{children}</UserContext.Provider>
}

export function useUserId() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserId must be used within UserProvider')
  }
  return context.userId
}

