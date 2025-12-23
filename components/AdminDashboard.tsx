'use client'

import { createClient } from '@/lib/supabase/client'
import type { Payment, Profile, UserStatistics } from '@/types'
import { ClipboardList, FileText, Shield, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AdminCaseStudyCreation from './AdminCaseStudyCreation'
import AdminTemplateManagement from './AdminTemplateManagement'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import Loader from './ui/loader'
import Skeleton from './ui/skeleton'

interface AdminDashboardProps {
  userId: string
}

export default function AdminDashboard({ userId }: AdminDashboardProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'users' | 'templates' | 'case-studies'>('users')
  const [users, setUsers] = useState<(Profile & { statistics?: UserStatistics; payments?: Payment[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingTierId, setUpdatingTierId] = useState<string | null>(null)

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      const { data: statistics, error: statsError } = await supabase
        .from('user_statistics')
        .select('*')

      if (statsError) throw statsError

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError

      const usersWithData = (profiles || []).map((profile) => ({
        ...profile,
        statistics: statistics?.find((s) => s.user_id === profile.id),
        payments: payments?.filter((p) => p.user_id === profile.id),
      }))

      setUsers(usersWithData as any)
    } catch (error: any) {
      toast.error('Greška pri učitavanju korisnika', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTierChange = async (userId: string, newTier: 'free' | 'pro' | 'admin') => {
    setUpdatingTierId(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ tier: newTier })
        .eq('id', userId)

      if (error) throw error

      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, tier: newTier } : user))
      )

      toast.success('Tier ažuriran', {
        description: `Korisnik je prebačen na ${newTier} tier.`,
      })
    } catch (error: any) {
      toast.error('Greška pri ažuriranju', {
        description: error.message,
      })
    } finally {
      setUpdatingTierId(null)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton height={40} width="300px" />
          <Skeleton height={20} width="400px" />
        </div>
        
        {/* Tabs Skeleton */}
        <div className="flex gap-2">
          <Skeleton height={40} width="120px" />
          <Skeleton height={40} width="120px" />
          <Skeleton height={40} width="120px" />
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </div>
        
        {/* Table Skeleton */}
        <div className="space-y-4">
          <Skeleton height={50} />
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="text-yellow-400" size={24} /> Admin Dashboard
        </h1>
        <p className="text-slate-400">Upravljanje korisnicima, statistikama i platama</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'users'
            ? 'text-white border-b-2 border-blue-500'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <Users size={16} /> Korisnici
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'templates'
            ? 'text-white border-b-2 border-blue-500'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <FileText size={16} /> Šabloni
        </button>
        <button
          onClick={() => setActiveTab('case-studies')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'case-studies'
            ? 'text-white border-b-2 border-blue-500'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <ClipboardList size={16} /> Studije Slučaja
        </button>
      </div>

      {activeTab === 'templates' && <AdminTemplateManagement userId={userId} />}
      {activeTab === 'case-studies' && <AdminCaseStudyCreation userId={userId} />}

      {activeTab === 'users' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Ukupno Korisnika</CardDescription>
                <CardTitle className="text-2xl text-white">{users.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Pro Korisnici</CardDescription>
                <CardTitle className="text-2xl text-white">
                  {users.filter((u) => u.tier === 'pro').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Ukupno Zadataka</CardDescription>
                <CardTitle className="text-2xl text-white">
                  {users.reduce((sum, u) => sum + (u.statistics?.total_tasks || 0), 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Ukupno Pregleda</CardDescription>
                <CardTitle className="text-2xl text-white">
                  {users.reduce((sum, u) => {
                    const views = parseInt(u.statistics?.total_views || '0', 10) || 0
                    return sum + views
                  }, 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <Input
              placeholder="Pretraži korisnike..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Users Table */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users size={20} /> Svi Korisnici
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400 text-sm font-medium">Korisnik</th>
                      <th className="text-left p-3 text-slate-400 text-sm font-medium">Tier</th>
                      <th className="text-left p-3 text-slate-400 text-sm font-medium">Zadaci</th>
                      <th className="text-left p-3 text-slate-400 text-sm font-medium">Pregledi</th>
                      <th className="text-left p-3 text-slate-400 text-sm font-medium">Akcije</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="p-3">
                          <div>
                            <div className="text-white font-medium">
                              {user.business_name || 'Nema imena'}
                            </div>
                            <div className="text-xs text-slate-500">{user.id.substring(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${user.tier === 'admin'
                              ? 'bg-yellow-900/30 text-yellow-300'
                              : user.tier === 'pro'
                                ? 'bg-purple-900/30 text-purple-300'
                                : 'bg-slate-800 text-slate-400'
                              }`}
                          >
                            {user.tier?.toUpperCase() || 'FREE'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">
                          {user.statistics?.total_tasks || 0} / {user.statistics?.published_tasks || 0}
                        </td>
                        <td className="p-3 text-slate-300">{user.statistics?.total_views || '0'}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <select
                              value={user.tier || 'free'}
                              onChange={(e) =>
                                handleTierChange(user.id, e.target.value as 'free' | 'pro' | 'admin')
                              }
                              disabled={updatingTierId === user.id}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              Detalji
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <Card className="bg-slate-900 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{selectedUser.business_name || 'Korisnik'}</CardTitle>
                      <CardDescription className="text-slate-400">
                        ID: {selectedUser.id}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-white font-bold mb-2">Statistike</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800 p-3 rounded">
                        <div className="text-slate-400 text-sm">Ukupno Zadataka</div>
                        <div className="text-white font-bold">{selectedUser.statistics?.total_tasks || 0}</div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded">
                        <div className="text-slate-400 text-sm">Objavljeno</div>
                        <div className="text-white font-bold">{selectedUser.statistics?.published_tasks || 0}</div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded">
                        <div className="text-slate-400 text-sm">Pregledi</div>
                        <div className="text-white font-bold">{selectedUser.statistics?.total_views || '0'}</div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded">
                        <div className="text-slate-400 text-sm">Angažman</div>
                        <div className="text-white font-bold">{selectedUser.statistics?.total_engagement || '0'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-2">Platni Istorija</h3>
                    <div className="space-y-2">
                      {selectedUser.payments && selectedUser.payments.length > 0 ? (
                        selectedUser.payments.map((payment) => (
                          <div key={payment.id} className="bg-slate-800 p-3 rounded flex justify-between">
                            <div>
                              <div className="text-white font-medium">
                                ${payment.amount} - {payment.status}
                              </div>
                              <div className="text-slate-400 text-sm">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-slate-400 text-sm">
                              {payment.tier_at_payment?.toUpperCase()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 text-sm">Nema platnih podataka</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}