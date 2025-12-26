'use client';

import { useCompetitors } from '@/lib/hooks/useCompetitors';
import { useProfile } from '@/lib/hooks/useProfile';
import { useTasks } from '@/lib/hooks/useTasks';
import { createClient } from '@/lib/supabase/client';
import {
  canCreateTask,
  getRemainingTasks,
  getTierLimits,
} from '@/lib/utils/tierRestrictions';
import type { TaskInsert, UserTier } from '@/types';
import {
  ClipboardList,
  Layout,
  Menu,
  Play,
  Plus,
  Shield,
  Trello,
  User,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Loader from './ui/loader';
import { UserProvider } from './UserContext';

// Lazy load NewIdeaWizard for faster initial load
const NewIdeaWizard = dynamic(() => import('./NewIdeaWizard'), {
  loading: () => <Loader text="Učitavanje..." />,
  ssr: false,
});

export default function AppLayout({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewIdeaWizardOpen, setIsNewIdeaWizardOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { profile, loading: profileLoading } = useProfile(userId);
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    addInspirationLink,
  } = useTasks(userId);
  const { loading: competitorsLoading } = useCompetitors(userId);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize loading state consistently - only show loader after mount
  // This ensures server and client render the same initial structure
  const showLoader =
    mounted && (profileLoading || tasksLoading || competitorsLoading);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error('Greška pri odjavljivanju', {
        description: error.message,
      });
      return;
    }

    toast.success('Uspešno odjavljivanje', {
      description: 'Vidimo se uskoro!',
    });

    router.refresh();
    router.push('/login');
  };

  const handleNewIdeaClick = () => {
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
    setIsSidebarOpen(false);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <UserProvider userId={userId}>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
        {/* Loader overlay - always rendered in same position to avoid hydration mismatch */}
        {showLoader && (
          <div suppressHydrationWarning>
            <Loader fullScreen text="Učitavanje..." />
          </div>
        )}
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
          <div className="font-bold text-xl text-white tracking-tighter flex items-center gap-2">
            <Image
              src="/viralio-icon-512.png"
              alt="Viralio"
              width={32}
              height={32}
            />
            {/* <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Play fill="white" size={16} className="text-white" />
            </div> */}
            Viralio
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-400"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="p-6">
              <div className="font-bold text-2xl text-white tracking-tighter items-center gap-2 mb-10 hidden lg:flex">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Play fill="white" size={16} className="text-white" />
                </div>
                Viralio
              </div>

              <div className="space-y-6">
                <button
                  onClick={handleNewIdeaClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 font-bold"
                >
                  <Plus size={20} />
                  <span>Nova Ideja</span>
                  {profile?.tier &&
                    (() => {
                      const userTaskCount = tasks.filter(
                        (t) => !t.is_admin_case_study
                      ).length;
                      const tier = profile.tier as UserTier;
                      const remaining = getRemainingTasks(tier, userTaskCount);
                      return (
                        remaining !== null && (
                          <span className="ml-auto text-xs opacity-75">
                            ({remaining} preostalo)
                          </span>
                        )
                      );
                    })()}
                </button>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                    Aplikacija
                  </p>

                  {profile?.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsSidebarOpen(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
                        isActive('/admin')
                          ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/20'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Shield size={20} />
                      <span className="font-medium">Admin</span>
                    </Link>
                  )}

                  <Link
                    href="/planner"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
                      isActive('/planner')
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Layout size={20} />
                    <span className="font-medium">Planer sadržaja</span>
                  </Link>
                  <Link
                    href="/competitors"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
                      isActive('/competitors')
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Trello size={20} />
                    <span className="font-medium">Konkurenti</span>
                  </Link>
                  <Link
                    href="/casestudy"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
                      isActive('/casestudy')
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <ClipboardList size={20} />
                    <span className="font-medium">Studije Slučaja</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
              <Link
                href="/profile"
                onClick={() => setIsSidebarOpen(false)}
                className="w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-slate-800"
              >
                <div
                  className={`w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white ${
                    isActive('/profile') ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {profile?.business_name
                    ? profile.business_name.substring(0, 2).toUpperCase()
                    : 'VL'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">
                    {profile?.business_name || 'Moj Profil'}
                  </p>
                  <p className="text-xs text-slate-500">Postavke & Nalog</p>
                </div>
                <User size={20} className="ml-auto text-slate-400" />
              </Link>
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
            {children}
          </main>
        </div>

        {/* Modals */}
        {isNewIdeaWizardOpen && (
          <NewIdeaWizard
            userId={userId}
            onClose={() => setIsNewIdeaWizardOpen(false)}
            onSaveToPlan={async (taskData, inspirationLinks) => {
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

              const result = await createTask({
                ...taskData,
                user_id: userId,
              } as TaskInsert);
              if (result.error) {
                toast.error('Greška pri kreiranju ideje', {
                  description: result.error,
                });
                return;
              }

              if (
                inspirationLinks &&
                inspirationLinks.length > 0 &&
                result.data
              ) {
                for (const linkData of inspirationLinks) {
                  await addInspirationLink(
                    result.data.id,
                    linkData.link,
                    linkData.displayUrl,
                    linkData.type
                  );
                }
              }

              toast.success('Ideja sačuvana!', {
                description: `"${taskData.title}" je dodata u planer.`,
              });
              setIsNewIdeaWizardOpen(false);
            }}
            userTier={profile?.tier as UserTier | undefined}
          />
        )}
      </div>
    </UserProvider>
  );
}
