'use client'

import { useCompetitors } from '@/lib/hooks/useCompetitors'
import { useProfile } from '@/lib/hooks/useProfile'
import { useTasks } from '@/lib/hooks/useTasks'
import { createClient } from '@/lib/supabase/client'
import { canCreateTask, canUseView, getRemainingTasks, getTierLimits } from '@/lib/utils/tierRestrictions'
import type { Competitor, SocialLink, Task, TaskInsert, TaskUpdate, UserTier } from '@/types'
import { Calendar, ClipboardList, Layout, Menu, Play, Plus, Shield, Trello, User, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AdminDashboard from './AdminDashboard'
import CalendarView from './CalendarView'
import CaseStudyDetailModal from './CaseStudyDetailModal'
import CaseStudyView from './CaseStudyView'
import CompetitorFeedModal from './CompetitorFeedModal'
import CompetitorsView from './CompetitorsView'
import GoalProgressDashboard from './GoalProgressDashboard'
import KanbanBoard from './KanbanBoard'
import NewIdeaWizard from './NewIdeaWizard'
import ProfileSettings from './ProfileSettings'
import TaskDetailModal from './TaskDetailModal'
import Loader from './ui/loader'
import Skeleton from './ui/skeleton'

export default function ViralVaultApp({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [currentView, setCurrentView] = useState('planner')
  const [plannerView, setPlannerView] = useState<'kanban' | 'calendar'>('kanban')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNewIdeaWizardOpen, setIsNewIdeaWizardOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<Task | null>(null)
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)

  const { profile, loading: profileLoading, updateProfile, addSocialLink, removeSocialLink } = useProfile(userId)
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    addInspirationLink,
    removeInspirationLink,
  } = useTasks(userId)
  const { competitors, loading: competitorsLoading, createCompetitor, deleteCompetitor } = useCompetitors(userId)

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error('Greška pri odjavljivanju', {
        description: error.message,
      })
      return
    }

    toast.success('Uspešno odjavljivanje', {
      description: 'Vidimo se uskoro!',
    })

    // Refresh to clear server-side session
    router.refresh()

    // Navigate to login
    router.push('/login')
  }

  const [isSavingTask, setIsSavingTask] = useState(false)

  const handleSaveToPlan = async (
    taskData: Omit<TaskInsert, 'user_id'>,
    inspirationLinks?: Array<{ link: string; displayUrl?: string; type?: string }>
  ) => {
    // Validate tier limits before creating task
    if (profile?.tier) {
      // Only count user's own tasks (exclude admin case studies)
      const userTaskCount = tasks.filter((t) => !t.is_admin_case_study).length
      const tier = profile.tier as UserTier
      const canCreate = canCreateTask(tier, userTaskCount)
      if (!canCreate) {
        toast.error('Dostigli ste limit zadataka', {
          description: `Vaš ${tier} tier dozvoljava maksimalno ${getTierLimits(tier).maxTasks} zadataka.`,
        })
        return
      }
    }

    setIsSavingTask(true)
    // createTask will add user_id automatically
    const result = await createTask({ ...taskData, user_id: userId } as TaskInsert)
    if (result.error) {
      toast.error('Greška pri kreiranju ideje', {
        description: result.error,
      })
      setIsSavingTask(false)
      return
    }

    // Add inspiration links if any
    if (inspirationLinks && inspirationLinks.length > 0 && result.data) {
      for (const linkData of inspirationLinks) {
        const linkResult = await addInspirationLink(result.data.id, linkData.link, linkData.displayUrl, linkData.type)
        if (linkResult.error) {
          toast.error('Greška pri dodavanju linka', {
            description: linkResult.error,
          })
        }
      }
    }

    toast.success('Ideja sačuvana!', {
      description: `"${taskData.title}" je dodata u planer.`,
    })
    setIsSavingTask(false)
  }

  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    setMovingTaskId(taskId)
    const result = await updateTask(taskId, { status: newStatus as any })
    if (result.error) {
      toast.error('Greška pri pomeranju', {
        description: result.error,
      })
    } else {
      const statusLabels: Record<string, string> = {
        idea: 'Ideja',
        ready: 'Spremno',
        scheduled: 'Zakazano',
        published: 'Objavljeno',
      }
      toast.success('Status ažuriran', {
        description: `Status promenjen na "${statusLabels[newStatus] || newStatus}".`,
      })
    }
    setMovingTaskId(null)
  }

  const handleTaskDrop = async (taskId: string, columnId: string) => {
    setMovingTaskId(taskId)
    const result = await updateTask(taskId, { status: columnId as any })
    if (result.error) {
      toast.error('Greška pri pomeranju', {
        description: result.error,
      })
    } else {
      const statusLabels: Record<string, string> = {
        idea: 'Ideja',
        ready: 'Spremno',
        scheduled: 'Zakazano',
        published: 'Objavljeno',
      }
      toast.success('Zadatak pomeren', {
        description: `Status promenjen na "${statusLabels[columnId] || columnId}".`,
      })
    }
    setMovingTaskId(null)
  }

  const [isUpdatingTask, setIsUpdatingTask] = useState(false)

  const handleUpdateTask = async (updates: TaskUpdate) => {
    if (!selectedTask) return
    setIsUpdatingTask(true)
    const result = await updateTask(selectedTask.id, updates)
    if (result.error) {
      toast.error('Greška pri ažuriranju', {
        description: result.error,
      })
    } else {
      toast.success('Zadatak ažuriran', {
        description: 'Izmene su sačuvane.',
      })
    }
    setIsUpdatingTask(false)
  }

  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)

  const handleAddInspirationLink = async (
    taskId: string,
    link: string,
    displayUrl?: string,
    type?: string
  ): Promise<{ data: any | null; error: string | null }> => {
    const result = await addInspirationLink(taskId, link, displayUrl, type)
    if (result.error) {
      toast.error('Greška pri dodavanju linka', {
        description: result.error,
      })
      return { data: null, error: result.error }
    } else {
      toast.success('Link dodat', {
        description: 'Link za inspiraciju je dodat.',
      })
      // Update selectedTask to reflect the new link
      const updatedTask = tasks.find((t) => t.id === taskId)
      if (updatedTask) {
        setSelectedTask(updatedTask)
      }
      return { data: result.data, error: null }
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    setDeletingTaskId(taskId)
    const result = await deleteTask(taskId)
    if (result.error) {
      toast.error('Greška pri brisanju', {
        description: result.error,
      })
    } else {
      toast.success('Zadatak obrisan', {
        description: task ? `"${task.title}" je uklonjen.` : 'Zadatak je uklonjen.',
      })
      setSelectedTask(null)
    }
    setDeletingTaskId(null)
  }

  const handleSaveProfile = async (profileData: Partial<typeof profile> & { social_links?: SocialLink[] }) => {
    const { social_links, ...profileFields } = profileData
    const profileResult = await updateProfile(profileFields)

    if (profileResult?.error) {
      toast.error('Greška pri čuvanju profila', {
        description: profileResult.error,
      })
      return
    }

    // Handle social links separately
    if (social_links) {
      const currentLinks = profile?.social_links || []
      const newLinks = social_links.filter((link) => !currentLinks.find((l) => l.id === link.id))
      const removedLinks = currentLinks.filter((link) => !social_links.find((l) => l.id === link.id))

      for (const link of newLinks) {
        const result = await addSocialLink(link.url)
        if (result?.error) {
          toast.error('Greška pri dodavanju linka', {
            description: result.error,
          })
        }
      }

      for (const link of removedLinks) {
        const result = await removeSocialLink(link.id)
        if (result?.error) {
          toast.error('Greška pri uklanjanju linka', {
            description: result.error,
          })
        }
      }
    }

    toast.success('Profil ažuriran', {
      description: 'Sve izmene su sačuvane.',
    })
  }

  const calculateProgress = useMemo(() => {
    if (!profile) {
      return {
        completedShort: 0,
        completedLong: 0,
        requiredShort: 0,
        requiredLong: 0,
        notification: null,
      }
    }

    const publishedTasks = tasks.filter((t) => t.status === 'published')
    const completedShort = publishedTasks.filter((t) => t.format === 'Kratka Forma').length
    const completedLong = publishedTasks.filter((t) => t.format === 'Duga Forma').length

    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const daysElapsed = dayOfMonth

    const completionRatio = daysElapsed / daysInMonth
    const requiredShort = Math.ceil((profile.monthly_goal_short || 0) * completionRatio)
    const requiredLong = Math.ceil((profile.monthly_goal_long || 0) * completionRatio)

    let notification: string | null = null

    if ((profile.monthly_goal_short || 0) > 0 && completedShort < requiredShort) {
      notification = `Kratka forma: Zaostajete (${completedShort}/${requiredShort} potrebno). Ubrzajte kreiranje!`
    } else if ((profile.monthly_goal_long || 0) > 0 && completedLong < requiredLong) {
      notification = `Duga forma: Zaostajete (${completedLong}/${requiredLong} potrebno). Ubrzajte kreiranje!`
    } else if (
      completedShort >= (profile.monthly_goal_short || 0) &&
      completedLong >= (profile.monthly_goal_long || 0)
    ) {
      notification = 'Čestitamo! Svi ciljevi za ovaj mesec su već ispunjeni. Kreirajte dalje!'
    }

    return {
      completedShort,
      completedLong,
      requiredShort,
      requiredLong,
      notification,
    }
  }, [tasks, profile])

  if (profileLoading || tasksLoading || competitorsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <Skeleton height={40} width="300px" />
            <Skeleton height={20} width="500px" />
          </div>

          {/* Sidebar Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <Skeleton height={50} />
              <Skeleton height={50} />
              <Skeleton height={50} />
              <Skeleton height={50} />
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-3 space-y-6">
              <Skeleton height={200} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton height={150} />
                <Skeleton height={150} />
              </div>
              <Skeleton height={300} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="font-bold text-xl text-white tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Play fill="white" size={16} className="text-white" />
          </div>
          ViralVault
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="p-6">
            <div className="font-bold text-2xl text-white tracking-tighter flex items-center gap-2 mb-10 hidden lg:flex">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Play fill="white" size={16} className="text-white" />
              </div>
              ViralVault
            </div>

            <div className="space-y-6">
              <button
                onClick={() => {
                  if (profile?.tier) {
                    // Only count user's own tasks (exclude admin case studies)
                    const userTaskCount = tasks.filter((t) => !t.is_admin_case_study).length
                    const tier = profile.tier as UserTier
                    const canCreate = canCreateTask(tier, userTaskCount)
                    if (!canCreate) {
                      toast.error('Dostigli ste limit zadataka', {
                        description: `Vaš ${tier} tier dozvoljava maksimalno ${getTierLimits(tier).maxTasks} zadataka.`,
                      })
                      return
                    }
                  }
                  setIsNewIdeaWizardOpen(true)
                  setIsSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 font-bold"
              >
                <Plus size={20} />
                <span>Nova Ideja</span>
                {profile?.tier && (() => {
                  const userTaskCount = tasks.filter((t) => !t.is_admin_case_study).length
                  const tier = profile.tier as UserTier
                  const remaining = getRemainingTasks(tier, userTaskCount)
                  return remaining !== null && (
                    <span className="ml-auto text-xs opacity-75">
                      ({remaining} preostalo)
                    </span>
                  )
                })()}
              </button>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Aplikacija</p>

                {profile?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setCurrentView('admin')
                      setIsSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${currentView === 'admin'
                      ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    <Shield size={20} />
                    <span className="font-medium">Admin</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setCurrentView('planner')
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${currentView === 'planner'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <Layout size={20} />
                  <span className="font-medium">Planer Sadržaja</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('competitors')
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${currentView === 'competitors'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <Trello size={20} />
                  <span className="font-medium">Konkurenti</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('casestudy')
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${currentView === 'casestudy'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <ClipboardList size={20} />
                  <span className="font-medium">Studije Slučaja</span>
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
            <button
              onClick={() => {
                setCurrentView('profile')
                setIsSidebarOpen(false)
              }}
              className="w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-slate-800"
            >
              <div
                className={`w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white ${currentView === 'profile' ? 'ring-2 ring-blue-500' : ''
                  }`}
              >
                {profile?.business_name ? profile.business_name.substring(0, 2).toUpperCase() : 'VL'}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{profile?.business_name || 'Moj Profil'}</p>
                <p className="text-xs text-slate-500">Postavke & Nalog</p>
              </div>
              <User size={20} className="ml-auto text-slate-400" />
            </button>
            <button
              onClick={handleSignOut}
              className="w-full mt-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 rounded-lg hover:bg-slate-800"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden h-screen overflow-y-auto">
          {currentView === 'planner' && (
            <>
              <header className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">Planer Sadržaja</h1>
                  <p className="text-slate-400">
                    {plannerView === 'kanban'
                      ? "Prevucite kartice (Drag 'n Drop) da promenite status ili kliknite za detalje."
                      : 'Vizuelno planiranje objava. Past obaveze su zatamnjene.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  {plannerView === 'kanban' && (
                    <button
                      onClick={() => {
                        if (profile?.tier) {
                          const userTaskCount = tasks.filter((t) => !t.is_admin_case_study).length
                          const tier = profile.tier as UserTier
                          const canCreate = canCreateTask(tier, userTaskCount)
                          if (!canCreate) {
                            toast.error('Dostigli ste limit zadataka', {
                              description: `Vaš ${tier} tier dozvoljava maksimalno ${getTierLimits(tier).maxTasks} zadataka.`,
                            })
                            return
                          }
                        }
                        setIsNewIdeaWizardOpen(true)
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} /> Nova Ideja
                    </button>
                  )}
                  <div className="bg-slate-800 px-4 py-2 rounded-lg text-sm text-slate-400 border border-slate-700 hidden md:block">
                    Ukupno ideja: <span className="text-white font-bold ml-1">{tasks.length}</span>
                  </div>
                  <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                    <button
                      onClick={() => setPlannerView('kanban')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${plannerView === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                      <Trello size={16} /> Kanban
                    </button>
                    {profile?.tier && canUseView(profile.tier as UserTier, 'calendar') && (
                      <button
                        onClick={() => setPlannerView('calendar')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${plannerView === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                          }`}
                      >
                        <Calendar size={16} /> Kalendar
                      </button>
                    )}
                    {profile?.tier && !canUseView(profile.tier as UserTier, 'calendar') && (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 cursor-not-allowed opacity-50"
                        title="Kalendar view je dostupan samo za Starter i Pro tier"
                      >
                        <Calendar size={16} /> Kalendar 🔒
                      </button>
                    )}
                  </div>
                </div>
              </header>

              {profile && (
                <GoalProgressDashboard
                  progress={calculateProgress}
                  goals={{
                    monthlyGoalShort: profile.monthly_goal_short || 0,
                    monthlyGoalLong: profile.monthly_goal_long || 0,
                  }}
                />
              )}

              {plannerView === 'kanban' ? (
                <KanbanBoard
                  tasks={tasks}
                  onMoveTask={handleMoveTask}
                  onDeleteTask={handleDeleteTask}
                  onTaskClick={setSelectedTask}
                  onTaskDrop={handleTaskDrop}
                  onNewIdea={() => setIsNewIdeaWizardOpen(true)}
                />
              ) : (
                <CalendarView tasks={tasks} onTaskClick={setSelectedTask} />
              )}
            </>
          )}

          {currentView === 'competitors' && (
            <CompetitorsView
              competitors={competitors}
              onCompetitorClick={setSelectedCompetitor}
              onAddCompetitor={async (comp) => {
                const result = await createCompetitor(comp)
                if (result.error) {
                  toast.error('Greška pri dodavanju konkurenta', {
                    description: result.error,
                  })
                } else {
                  toast.success('Konkurent dodat', {
                    description: `"${comp.name}" je dodat na listu.`,
                  })
                }
              }}
              onRemoveCompetitor={async (id) => {
                const competitor = competitors.find((c) => c.id === id)
                const result = await deleteCompetitor(id)
                if (result.error) {
                  toast.error('Greška pri brisanju', {
                    description: result.error,
                  })
                } else {
                  toast.success('Konkurent uklonjen', {
                    description: competitor ? `"${competitor.name}" je uklonjen.` : 'Konkurent je uklonjen.',
                  })
                }
              }}
            />
          )}

          {currentView === 'casestudy' && (
            <CaseStudyView
              tasks={tasks}
              onCaseStudyClick={setSelectedCaseStudy}
              userId={userId}
              userTier={profile?.tier as UserTier | undefined}
            />
          )}

          {currentView === 'admin' && profile?.role === 'admin' && (
            <AdminDashboard userId={userId} />
          )}

          {currentView === 'profile' && profile && (
            <ProfileSettings profile={profile} onSave={handleSaveProfile} />
          )}
        </main>
      </div>

      {/* Loading overlay for saving task */}
      {isSavingTask && <Loader fullScreen text="Čuvanje ideje..." />}

      {/* Modals */}
      {isNewIdeaWizardOpen && (
        <NewIdeaWizard
          onClose={() => setIsNewIdeaWizardOpen(false)}
          onSaveToPlan={handleSaveToPlan}
          userTier={profile?.tier as UserTier | undefined}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={handleDeleteTask}
          onUpdate={handleUpdateTask}
          onAddInspirationLink={handleAddInspirationLink as any}
          onRemoveInspirationLink={async (linkId) => {
            const result = await removeInspirationLink(linkId)
            if (result.error) {
              toast.error('Greška pri uklanjanju linka', {
                description: result.error,
              })
            } else {
              toast.success('Link uklonjen', {
                description: 'Link za inspiraciju je uklonjen.',
              })
            }
          }}
        />
      )}

      {selectedCaseStudy && (
        <CaseStudyDetailModal task={selectedCaseStudy} onClose={() => setSelectedCaseStudy(null)} />
      )}

      {selectedCompetitor && (
        <CompetitorFeedModal competitor={selectedCompetitor} onClose={() => setSelectedCompetitor(null)} />
      )}
    </div>
  )
}
