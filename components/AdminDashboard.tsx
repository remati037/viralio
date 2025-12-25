'use client'

import { createClient } from '@/lib/supabase/client'
import type { Payment, Profile, UserStatistics } from '@/types'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ClipboardList, Edit, FileText, Plus, Shield, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import AdminCaseStudyCreation from './AdminCaseStudyCreation'
import AdminTemplateManagement from './AdminTemplateManagement'
import CreateUserModal from './CreateUserModal'
import DeleteUserModal from './DeleteUserModal'
import UpdateUserModal from './UpdateUserModal'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import Loader from './ui/loader'

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
  const [userToUpdate, setUserToUpdate] = useState<Profile | null>(null)
  const [userEmails, setUserEmails] = useState<Record<string, string>>({})
  const [emailConfirmations, setEmailConfirmations] = useState<Record<string, boolean>>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loadingEmails, setLoadingEmails] = useState(false)
  const [userRealStatistics, setUserRealStatistics] = useState<{
    total_tasks: number
    published_tasks: number
    total_views: string
    total_engagement: string
    total_conversions: string
  } | null>(null)
  const [loadingStatistics, setLoadingStatistics] = useState(false)

  useEffect(() => {
    fetchAllUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchUserRealStatistics(selectedUser.id)
    } else {
      setUserRealStatistics(null)
    }
  }, [selectedUser])

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

      // Fetch emails for all users (wait for completion before showing table)
      setLoadingEmails(true)
      await fetchUserEmails(profiles?.map((p) => p.id) || [])
      setLoadingEmails(false)
    } catch (error: any) {
      toast.error('Greška pri učitavanju korisnika', {
        description: error.message,
      })
      setLoadingEmails(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserEmails = async (userIds: string[]) => {
    // Fetch emails and confirmation status in batches to avoid overwhelming the API
    const batchSize = 5
    const emailMap: Record<string, string> = {}
    const confirmationMap: Record<string, boolean> = {}

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (userId) => {
          try {
            const response = await fetch(`/api/admin/users/${userId}/get`)
            if (response.ok) {
              const data = await response.json()
              if (data.email) {
                emailMap[userId] = data.email
              }
              if (data.email_confirmed !== undefined) {
                confirmationMap[userId] = data.email_confirmed
              }
            }
          } catch (error) {
            console.error(`Error fetching email for user ${userId}:`, error)
          }
        })
      )
    }

    setUserEmails((prev) => ({ ...prev, ...emailMap }))
    setEmailConfirmations((prev) => ({ ...prev, ...confirmationMap }))
  }

  const fetchUserRealStatistics = async (userId: string) => {
    setLoadingStatistics(true)
    try {
      // Fetch all tasks for this user
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, result_views, result_engagement, result_conversions')
        .eq('user_id', userId)

      if (tasksError) throw tasksError

      // Calculate real statistics from tasks
      const totalTasks = tasks?.length || 0
      const publishedTasks = tasks?.filter((t) => t.status === 'published').length || 0

      // Sum up views, engagement, and conversions from published tasks
      let totalViews = 0
      let totalEngagement = 0
      let totalConversions = 0

      tasks?.forEach((task) => {
        if (task.status === 'published') {
          // Parse numeric values from strings, defaulting to 0 if null or invalid
          const views = parseInt(task.result_views || '0', 10) || 0
          const engagement = parseInt(task.result_engagement || '0', 10) || 0
          const conversions = parseInt(task.result_conversions || '0', 10) || 0

          totalViews += views
          totalEngagement += engagement
          totalConversions += conversions
        }
      })

      setUserRealStatistics({
        total_tasks: totalTasks,
        published_tasks: publishedTasks,
        total_views: totalViews.toString(),
        total_engagement: totalEngagement.toString(),
        total_conversions: totalConversions.toString(),
      })
    } catch (error: any) {
      toast.error('Greška pri učitavanju statistika', {
        description: error.message,
      })
      setUserRealStatistics(null)
    } finally {
      setLoadingStatistics(false)
    }
  }

  // const handleTierChange = async (userId: string, newTier: 'pro' | 'admin') => {
  //   setUpdatingTierId(userId)
  //   try {
  //     const { error } = await supabase
  //       .from('profiles')
  //       .update({ tier: newTier })
  //       .eq('id', userId)

  //     if (error) throw error

  //     setUsers((prev) =>
  //       prev.map((user) => (user.id === userId ? { ...user, tier: newTier } : user))
  //     )

  //     toast.success('Tier ažuriran', {
  //       description: `Korisnik je prebačen na ${newTier} tier.`,
  //     })
  //   } catch (error: any) {
  //     toast.error('Greška pri ažuriranju', {
  //       description: error.message,
  //     })
  //   } finally {
  //     setUpdatingTierId(null)
  //   }
  // }

  // Define columns for TanStack Table
  const columns = useMemo<ColumnDef<Profile & { statistics?: UserStatistics; payments?: Payment[] }>[]>(
    () => [
      {
        accessorKey: 'business_name',
        size: 300,
        minSize: 250,
        maxSize: 400,
        header: ({ column }) => {
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-2 hover:text-white transition-colors text-slate-400 text-sm font-medium"
            >
              Korisnik
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp size={14} />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown size={14} />
              ) : (
                <ArrowUpDown size={14} />
              )}
            </button>
          )
        },
        cell: ({ row }) => {
          const user = row.original
          const email = userEmails[user.id]
          return (
            <div className="min-w-[250px]">
              <div className="text-white font-medium flex items-center gap-2">
                {user.business_name || 'Nema imena'}
                {emailConfirmations[user.id] === false && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-900/30 text-yellow-300 border border-yellow-800">
                    Email Nije Potvrđen
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 min-h-[16px]">
                {email ? (
                  <span className="text-slate-400">{email}</span>
                ) : (
                  <span className="invisible">Loading...</span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'tier',
        size: 120,
        header: ({ column }) => {
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-2 hover:text-white transition-colors text-slate-400 text-sm font-medium"
            >
              Tier
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp size={14} />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown size={14} />
              ) : (
                <ArrowUpDown size={14} />
              )}
            </button>
          )
        },
        cell: ({ row }) => {
          const user = row.original
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${user.tier === 'admin'
                ? 'bg-yellow-900/30 text-yellow-300'
                : user.tier === 'pro'
                  ? 'bg-purple-900/30 text-purple-300'
                  : 'bg-slate-800 text-slate-400'
                }`}
            >
              {user.tier?.toUpperCase() || 'PRO'}
            </span>
          )
        },
      },
      {
        id: 'tasks',
        size: 120,
        header: ({ column }) => {
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-2 hover:text-white transition-colors text-slate-400 text-sm font-medium"
            >
              Zadaci
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp size={14} />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown size={14} />
              ) : (
                <ArrowUpDown size={14} />
              )}
            </button>
          )
        },
        accessorFn: (row) => row.statistics?.total_tasks || 0,
        cell: ({ row }) => {
          const user = row.original
          return (
            <span className="text-slate-300">
              {user.statistics?.total_tasks || 0} / {user.statistics?.published_tasks || 0}
            </span>
          )
        },
      },
      {
        id: 'views',
        size: 120,
        header: ({ column }) => {
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-2 hover:text-white transition-colors text-slate-400 text-sm font-medium"
            >
              Pregledi
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp size={14} />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown size={14} />
              ) : (
                <ArrowUpDown size={14} />
              )}
            </button>
          )
        },
        accessorFn: (row) => parseInt(row.statistics?.total_views || '0', 10) || 0,
        cell: ({ row }) => {
          const user = row.original
          return <span className="text-slate-300">{user.statistics?.total_views || '0'}</span>
        },
      },
      {
        id: 'actions',
        size: 400,
        header: 'Akcije',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex gap-2 flex-wrap">
              {/* <select
                value={user.tier || 'pro'}
                onChange={(e) => {
                  handleTierChange(user.id, e.target.value as 'pro' | 'admin')
                }}
                disabled={updatingTierId === user.id}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
              >
                <option value="pro">Pro</option>
                <option value="admin">Admin</option>
              </select> */}
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                Detalji
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUserToUpdate(user)
                  setIsUpdateModalOpen(true)
                }}
                className="flex items-center gap-1"
              >
                <Edit size={14} /> Ažuriraj
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUserToDelete(user)
                  setIsDeleteModalOpen(true)
                }}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 hover:border-red-500"
              >
                <Trash2 size={14} /> Obriši
              </Button>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [userEmails, emailConfirmations, updatingTierId]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const user = row.original
      const search = filterValue.toLowerCase()
      return (
        user.business_name?.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search) ||
        userEmails[user.id]?.toLowerCase().includes(search) ||
        false
      )
    },
    state: {
      sorting,
      globalFilter: searchTerm,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (loading || loadingEmails) {
    return <Loader fullScreen text="Učitavanje korisnika..." />
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

          {/* Search and Create User */}
          <div className="flex gap-4 justify-between items-center">
            <Input
              placeholder="Pretraži korisnike..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md bg-slate-800 border-slate-700 text-white"
            />
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} /> Kreiraj Korisnika
            </Button>
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
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b border-slate-700">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="text-left p-3 text-slate-400 text-sm font-medium"
                            style={{
                              width: header.getSize(),
                              minWidth: header.column.columnDef.minSize,
                              maxWidth: header.column.columnDef.maxSize,
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="p-8 text-center text-slate-500">
                          Nema korisnika za prikaz
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="p-3"
                              style={{
                                width: cell.column.getSize(),
                                minWidth: cell.column.columnDef.minSize,
                                maxWidth: cell.column.columnDef.maxSize,
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-400">
                  Prikazano {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} -{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{' '}
                  od {table.getFilteredRowModel().rows.length} korisnika
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Prethodna
                  </Button>
                  <div className="text-sm text-slate-400">
                    Strana {table.getState().pagination.pageIndex + 1} od {table.getPageCount()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Sledeća
                  </Button>
                </div>
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
                      {userEmails[selectedUser.id] && (
                        <CardDescription className="text-slate-400 flex items-center gap-2">
                          Email: {userEmails[selectedUser.id]}
                          {emailConfirmations[selectedUser.id] === false && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-900/30 text-yellow-300 border border-yellow-800">
                              Email Nije Potvrđen
                            </span>
                          )}
                          {emailConfirmations[selectedUser.id] === true && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-900/30 text-green-300 border border-green-800">
                              Email Potvrđen
                            </span>
                          )}
                        </CardDescription>
                      )}
                      {(selectedUser as any).has_unlimited_free && (
                        <div className="mt-2">
                          <span className="px-2 py-1 rounded text-xs font-bold bg-green-900/30 text-green-300">
                            Neograničena Besplatna PRO Pretplata
                          </span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-white font-bold mb-2">Statistike</h3>
                    {loadingStatistics ? (
                      <div className="text-slate-400 text-sm">Učitavanje statistika...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-3 rounded">
                          <div className="text-slate-400 text-sm">Ukupno Zadataka</div>
                          <div className="text-white font-bold">{userRealStatistics?.total_tasks || 0}</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                          <div className="text-slate-400 text-sm">Objavljeno</div>
                          <div className="text-white font-bold">{userRealStatistics?.published_tasks || 0}</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                          <div className="text-slate-400 text-sm">Pregledi</div>
                          <div className="text-white font-bold">{userRealStatistics?.total_views || '0'}</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                          <div className="text-slate-400 text-sm">Angažman</div>
                          <div className="text-white font-bold">{userRealStatistics?.total_engagement || '0'}</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                          <div className="text-slate-400 text-sm">Konverzije</div>
                          <div className="text-white font-bold">{userRealStatistics?.total_conversions || '0'}</div>
                        </div>
                      </div>
                    )}
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

          {/* Create User Modal */}
          <CreateUserModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onUserCreated={fetchAllUsers}
          />

          {/* Delete User Modal */}
          <DeleteUserModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false)
              setUserToDelete(null)
            }}
            onUserDeleted={fetchAllUsers}
            user={
              userToDelete
                ? {
                  id: userToDelete.id,
                  email: userEmails[userToDelete.id],
                  business_name: userToDelete.business_name || undefined,
                }
                : null
            }
          />

          {/* Update User Modal */}
          <UpdateUserModal
            isOpen={isUpdateModalOpen}
            onClose={() => {
              setIsUpdateModalOpen(false)
              setUserToUpdate(null)
            }}
            onUserUpdated={fetchAllUsers}
            user={
              userToUpdate
                ? {
                  ...userToUpdate,
                  email: userEmails[userToUpdate.id],
                  email_confirmed: emailConfirmations[userToUpdate.id],
                }
                : null
            }
          />
        </>
      )}
    </div>
  )
}