'use client';

import GoalProgressDashboard from '@/components/GoalProgressDashboard';
import KanbanBoard from '@/components/KanbanBoard';
import Loader from '@/components/ui/loader';
import { useUserId } from '@/components/UserContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { useTasks } from '@/lib/hooks/useTasks';
import {
  canCreateTask,
  canUseView,
  getTierLimits,
} from '@/lib/utils/tierRestrictions';
import type { Task, TaskInsert, UserTier } from '@/types';
import { Calendar, Plus, Trello } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// Lazy load heavy components for faster initial load
const CalendarView = dynamic(() => import('@/components/CalendarView'), {
  loading: () => <Loader text="Učitavanje kalendara..." />,
  ssr: false,
});

const NewIdeaWizard = dynamic(() => import('@/components/NewIdeaWizard'), {
  loading: () => <Loader text="Učitavanje..." />,
  ssr: false,
});

const TaskDetailModal = dynamic(() => import('@/components/TaskDetailModal'), {
  loading: () => null, // Don't show loader for modal
  ssr: false,
});

export default function PlannerPage() {
  const userId = useUserId();
  const [plannerView, setPlannerView] = useState<'kanban' | 'calendar'>(
    'kanban'
  );
  const [isNewIdeaWizardOpen, setIsNewIdeaWizardOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const { profile, loading: profileLoading } = useProfile(userId);
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask: updateTaskHook,
    deleteTask: deleteTaskHook,
    addInspirationLink: addInspirationLinkHook,
    removeInspirationLink: removeInspirationLinkHook,
  } = useTasks(userId);

  const handleSaveToPlan = async (
    taskData: Omit<TaskInsert, 'user_id'>,
    inspirationLinks?: Array<{
      link: string;
      displayUrl?: string;
      type?: string;
    }>
  ) => {
    if (profile?.tier) {
      const userTaskCount = tasks.filter((t) => !t.is_admin_case_study).length;
      const tier = profile.tier as UserTier;
      const canCreate = canCreateTask(tier, userTaskCount);
      if (!canCreate) {
        toast.error('Dostigli ste limit zadataka', {
          description: `Vaš ${tier} tier dozvoljava maksimalno ${
            getTierLimits(tier).maxTasks
          } zadataka.`,
        });
        return;
      }
    }

    setIsSavingTask(true);
    const result = await createTask({
      ...taskData,
      user_id: userId,
    } as TaskInsert);
    if (result.error) {
      toast.error('Greška pri kreiranju ideje', {
        description: result.error,
      });
      setIsSavingTask(false);
      return;
    }

    if (inspirationLinks && inspirationLinks.length > 0 && result.data) {
      for (const linkData of inspirationLinks) {
        const linkResult = await addInspirationLinkHook(
          result.data.id,
          linkData.link,
          linkData.displayUrl,
          linkData.type
        );
        if (linkResult.error) {
          toast.error('Greška pri dodavanju linka', {
            description: linkResult.error,
          });
        }
      }
    }

    toast.success('Ideja sačuvana!', {
      description: `"${taskData.title}" je dodata u planer.`,
    });
    setIsSavingTask(false);
    setIsNewIdeaWizardOpen(false);
  };

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    setMovingTaskId(taskId);
    const result = await updateTaskHook(taskId, { status: newStatus as any });
    if (result.error) {
      toast.error('Greška pri pomeranju', {
        description: result.error,
      });
    } else {
      const statusLabels: Record<string, string> = {
        idea: 'Ideja',
        ready: 'Spremno',
        scheduled: 'Zakazano',
        published: 'Objavljeno',
      };
      toast.success('Status ažuriran', {
        description: `Status promenjen na "${
          statusLabels[newStatus] || newStatus
        }".`,
      });
    }
    setMovingTaskId(null);
  };

  const handleTaskDrop = async (taskId: string, columnId: string) => {
    setMovingTaskId(taskId);
    const result = await updateTaskHook(taskId, { status: columnId as any });
    if (result.error) {
      toast.error('Greška pri pomeranju', {
        description: result.error,
      });
    } else {
      const statusLabels: Record<string, string> = {
        idea: 'Ideja',
        ready: 'Spremno',
        scheduled: 'Zakazano',
        published: 'Objavljeno',
      };
      toast.success('Zadatak pomeren', {
        description: `Status promenjen na "${
          statusLabels[columnId] || columnId
        }".`,
      });
    }
    setMovingTaskId(null);
  };

  const handleUpdateTask = async (updates: any) => {
    if (!selectedTask) return;
    setIsUpdatingTask(true);
    const result = await updateTaskHook(selectedTask.id, updates);
    if (result.error) {
      toast.error('Greška pri ažuriranju', {
        description: result.error,
      });
    } else {
      toast.success('Zadatak ažuriran', {
        description: 'Izmene su sačuvane.',
      });
    }
    setIsUpdatingTask(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setDeletingTaskId(taskId);
    const result = await deleteTaskHook(taskId);
    if (result.error) {
      toast.error('Greška pri brisanju', {
        description: result.error,
      });
    } else {
      toast.success('Zadatak obrisan', {
        description: task
          ? `"${task.title}" je uklonjen.`
          : 'Zadatak je uklonjen.',
      });
      setSelectedTask(null);
    }
    setDeletingTaskId(null);
  };

  const handleAddInspirationLink = async (
    taskId: string,
    link: string,
    displayUrl?: string,
    type?: string
  ): Promise<{ data: any | null; error: string | null }> => {
    const result = await addInspirationLinkHook(taskId, link, displayUrl, type);
    if (result.error) {
      toast.error('Greška pri dodavanju linka', {
        description: result.error,
      });
      return { data: null, error: result.error };
    } else {
      toast.success('Link dodat', {
        description: 'Link za inspiraciju je dodat.',
      });
      const updatedTask = tasks.find((t) => t.id === taskId);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
      return { data: result.data, error: null };
    }
  };

  const calculateProgress = useMemo(() => {
    if (!profile) {
      return {
        completedShort: 0,
        completedLong: 0,
        requiredShort: 0,
        requiredLong: 0,
        notification: null,
      };
    }

    const publishedTasks = tasks.filter((t) => t.status === 'published');
    const completedShort = publishedTasks.filter(
      (t) => t.format === 'Kratka Forma'
    ).length;
    const completedLong = publishedTasks.filter(
      (t) => t.format === 'Duga Forma'
    ).length;

    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const dayOfMonth = now.getDate();
    const daysElapsed = dayOfMonth;

    const completionRatio = daysElapsed / daysInMonth;
    const requiredShort = Math.ceil(
      (profile.monthly_goal_short || 0) * completionRatio
    );
    const requiredLong = Math.ceil(
      (profile.monthly_goal_long || 0) * completionRatio
    );

    let notification: string | null = null;

    if (
      (profile.monthly_goal_short || 0) > 0 &&
      completedShort < requiredShort
    ) {
      notification = `Kratka forma: ${completedShort}/${requiredShort}. Ubrzajte kreiranje!`;
    } else if (
      (profile.monthly_goal_long || 0) > 0 &&
      completedLong < requiredLong
    ) {
      notification = `Duga forma: ${completedLong}/${requiredLong}. Ubrzajte kreiranje!`;
    } else if (
      completedShort >= (profile.monthly_goal_short || 0) &&
      completedLong >= (profile.monthly_goal_long || 0)
    ) {
      notification =
        'Čestitamo! Svi ciljevi za ovaj mesec su već ispunjeni. Kreirajte dalje!';
    }

    return {
      completedShort,
      completedLong,
      requiredShort,
      requiredLong,
      notification,
    };
  }, [tasks, profile]);

  if (profileLoading || tasksLoading) {
    return <Loader fullScreen text="Učitavanje planera..." />;
  }

  return (
    <>
      <header className="mb-4 md:mb-8 flex items-start md:items-center justify-between flex-col md:flex-row gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Planer sadržaja
          </h1>
          <p className="text-slate-400 text-sm text-balance">
            {plannerView === 'kanban'
              ? 'Prevucite kartice da promenite status ili kliknite na karticu za detalje.'
              : 'Vizuelno planiranje objava. Objavljene skripte su zatamnjene.'}
          </p>
        </div>
        <div className="flex gap-3">
          {plannerView === 'kanban' && (
            <button
              onClick={() => {
                if (profile?.tier) {
                  const userTaskCount = tasks.filter(
                    (t) => !t.is_admin_case_study
                  ).length;
                  const tier = profile.tier as UserTier;
                  const canCreate = canCreateTask(tier, userTaskCount);
                  if (!canCreate) {
                    toast.error('Dostigli ste limit zadataka', {
                      description: `Vaš ${tier} tier dozvoljava maksimalno ${
                        getTierLimits(tier).maxTasks
                      } zadataka.`,
                    });
                    return;
                  }
                }
                setIsNewIdeaWizardOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Nova ideja
            </button>
          )}
          <div className="bg-slate-800 px-4 py-2 rounded-lg text-sm text-slate-400 border border-slate-700 hidden md:flex items-center">
            Ukupno ideja:{' '}
            <span className="text-white font-bold ml-1">{tasks.length}</span>
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setPlannerView('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                plannerView === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Trello size={16} /> Kanban
            </button>
            {profile?.tier &&
              canUseView(profile.tier as UserTier, 'calendar') && (
                <button
                  onClick={() => setPlannerView('calendar')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    plannerView === 'calendar'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Calendar size={16} /> Kalendar
                </button>
              )}
            {profile?.tier &&
              !canUseView(profile.tier as UserTier, 'calendar') && (
                <button
                  disabled
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 cursor-not-allowed opacity-50"
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

      {isNewIdeaWizardOpen && userId && (
        <NewIdeaWizard
          onClose={() => setIsNewIdeaWizardOpen(false)}
          onSaveToPlan={handleSaveToPlan}
          userTier={profile?.tier as UserTier | undefined}
          userId={userId}
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
            const result = await removeInspirationLinkHook(linkId);
            if (result.error) {
              toast.error('Greška pri uklanjanju linka', {
                description: result.error,
              });
            } else {
              toast.success('Link uklonjen', {
                description: 'Link za inspiraciju je uklonjen.',
              });
            }
          }}
        />
      )}
    </>
  );
}
