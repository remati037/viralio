'use client';

import GoalProgressDashboard from '@/components/GoalProgressDashboard';
import KanbanBoard from '@/components/KanbanBoard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Loader from '@/components/ui/loader';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserId } from '@/components/UserContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { useTasks } from '@/lib/hooks/useTasks';
import { isLongFormHidden } from '@/lib/utils/featureFlags';
import {
  canCreateTask,
  canUseView,
  getTierLimits,
} from '@/lib/utils/tierRestrictions';
import type { Task, TaskInsert, UserTier } from '@/types';
import { Calendar, Kanban, Plus } from 'lucide-react';
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

/** Serbian plural form of "skripta": 1 skripta, 2–4 skripte, 5+ skripti (e.g. 21 skripta, 22 skripte, 25 skripti). */
function skriptaForm(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'skripta';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20))
    return 'skripte';
  return 'skripti';
}

export default function PlannerPage() {
  const userId = useUserId();
  const [plannerView, setPlannerView] = useState<'kanban' | 'calendar'>(
    'kanban',
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
    }>,
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
          linkData.type,
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

  const handleCalendarUpdatePublishDate = async (
    taskId: string,
    publishDate: string,
  ) => {
    const result = await updateTaskHook(taskId, { publish_date: publishDate });
    if (result.error) {
      toast.error('Greška pri promeni datuma', {
        description: result.error,
      });
    } else {
      toast.success('Datum ažuriran', {
        description: 'Datum objave je promenjen.',
      });
    }
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
    type?: string,
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
      (t) => t.format === 'Kratka Forma',
    ).length;
    const completedLong = publishedTasks.filter(
      (t) => t.format === 'Duga Forma',
    ).length;

    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const dayOfMonth = now.getDate();
    const daysElapsed = dayOfMonth;

    const completionRatio = daysElapsed / daysInMonth;
    const requiredShort = Math.ceil(
      (profile.monthly_goal_short || 0) * completionRatio,
    );
    const requiredLong = Math.ceil(
      (profile.monthly_goal_long || 0) * completionRatio,
    );

    let notification: string | null = null;

    if (
      (profile.monthly_goal_short || 0) > 0 &&
      completedShort < requiredShort
    ) {
      notification = `Kratka forma: ${completedShort}/${requiredShort}. Ubrzajte kreiranje!`;
    } else if (
      !isLongFormHidden() &&
      (profile.monthly_goal_long || 0) > 0 &&
      completedLong < requiredLong
    ) {
      notification = `Duga forma: ${completedLong}/${requiredLong}. Ubrzajte kreiranje!`;
    } else if (
      completedShort >= (profile.monthly_goal_short || 0) &&
      (isLongFormHidden() ||
        completedLong >= (profile.monthly_goal_long || 0))
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

  // if (profileLoading || tasksLoading) {
  //   return <Loader fullScreen text="Učitavanje planera..." />;
  // }

  const openNewIdeaWizard = () => {
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
    setIsNewIdeaWizardOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 md:space-y-6 min-w-0 overflow-x-hidden h-full">
        <header className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-start md:justify-between min-w-0">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 md:gap-3 tracking-tight truncate">
              Planer sadržaja
              <Badge
                variant="outline"
                className="ml-2 px-2.5 py-0.5 md:px-3 md:py-1 font-medium text-sm md:text-sm md:font-semibold rounded-lg text-muted-foreground border-border bg-muted/50 shadow-sm"
              >
                {tasks.length} {skriptaForm(tasks.length)}
              </Badge>
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm text-balance max-w-xl hidden sm:block">
              {plannerView === 'kanban'
                ? 'Prevuci kartice da promeniš status ili klikni za više detalja.'
                : 'Vizuelno planiraj objave. Objavljene skripte su zatamnjene.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
            <Button
              onClick={openNewIdeaWizard}
              size="lg"
              className="h-8 md:h-9 px-3 md:px-4"
            >
              <Plus size={14} className="md:w-4 md:h-4" />
              Nova skripta
            </Button>
            <div className="flex bg-muted/80 rounded-lg p-0.5 md:p-1 border border-border">
              <Button
                variant={plannerView === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPlannerView('kanban')}
                className={`md:h-9 md:px-4 md:py-2 md:text-sm ${
                  plannerView === 'kanban'
                    ? 'bg-chart-1 hover:bg-chart-1/90 text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Kanban size={16} />
                Kanban
              </Button>
              {profile?.tier &&
                canUseView(profile.tier as UserTier, 'calendar') && (
                  <Button
                    variant={plannerView === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPlannerView('calendar')}
                    className={`md:h-9 md:px-4 md:py-2 md:text-sm ${
                      plannerView === 'calendar'
                        ? 'bg-chart-1 hover:bg-chart-1/90 text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Calendar size={16} />
                    Kalendar
                  </Button>
                )}
              {profile?.tier &&
                !canUseView(profile.tier as UserTier, 'calendar') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="opacity-50 cursor-not-allowed md:h-9 md:px-4 md:py-2 md:text-sm"
                        >
                          <Calendar size={16} />
                          Kalendar 🔒
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      Kalendar je dostupan samo za Starter i Pro pretplatu
                    </TooltipContent>
                  </Tooltip>
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

        <div key={plannerView} className="w-full overflow-x-auto h-full">
          {plannerView === 'kanban' ? (
            <KanbanBoard
              tasks={tasks}
              onMoveTask={handleMoveTask}
              onDeleteTask={handleDeleteTask}
              onTaskClick={setSelectedTask}
              onTaskDrop={handleTaskDrop}
              onNewIdea={openNewIdeaWizard}
            />
          ) : (
            <CalendarView
              tasks={tasks}
              onTaskClick={setSelectedTask}
              onUpdatePublishDate={handleCalendarUpdatePublishDate}
            />
          )}
        </div>

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
      </div>
    </TooltipProvider>
  );
}
