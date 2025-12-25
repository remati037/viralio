'use client'

import { useUserId } from '@/components/UserContext'
import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage() {
  const userId = useUserId()

  return <AdminDashboard userId={userId} />
}

