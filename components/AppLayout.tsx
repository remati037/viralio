'use client';

import { useCompetitors } from '@/lib/hooks/useCompetitors';
import { useProfile } from '@/lib/hooks/useProfile';
import { useTasks } from '@/lib/hooks/useTasks';
import { createClient } from '@/lib/supabase/client';
import { canCreateTask, getTierLimits } from '@/lib/utils/tierRestrictions';
import type { TaskInsert, UserTier } from '@/types';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppSidebar } from './app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import Loader from './ui/loader';
import { Separator } from './ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { UserProvider } from './UserContext';

// Lazy load NewIdeaWizard for faster initial load
const NewIdeaWizard = dynamic(() => import('./NewIdeaWizard'), {
  loading: () => <Loader text="Učitavanje..." />,
  ssr: false,
});

export default function AppLayout({
  userId,
  user,
  children,
}: {
  userId: string;
  user: { name: string; email: string; avatar?: string };
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

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position when sidebar closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isSidebarOpen]);

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

  // Path segment → breadcrumb label (matches sidebar nav)
  const SEGMENT_LABELS: Record<string, string> = {
    pocetna: 'Početna',
    admin: 'Admin',
    planner: 'Planer sadržaja',
    competitors: 'Konkurenti',
    casestudy: 'Studije slučaja',
    statistics: 'Statistika',
    'ai-credits': 'AI Krediti',
    categories: 'Kategorije',
    profile: 'Profil',
    settings: 'Podešavanja',
    payments: 'Plaćanje',
  };

  const HOME_LABEL = 'Početna';
  const HOME_HREF = '/pocetna';

  // Build breadcrumb items from current pathname
  const breadcrumbItems = (() => {
    const segments = pathname.split('/').filter(Boolean);
    // Homepage: single "Početna" (no duplicate)
    if (segments.length === 0 || pathname === HOME_HREF) {
      return [{ href: HOME_HREF, label: HOME_LABEL, isCurrent: true }];
    }
    const items: { href: string; label: string; isCurrent: boolean }[] = [];
    let path = '';
    for (let i = 0; i < segments.length; i++) {
      path += `/${segments[i]}`;
      const label = SEGMENT_LABELS[segments[i]] ?? segments[i];
      items.push({
        href: path,
        label,
        isCurrent: i === segments.length - 1,
      });
    }
    return [{ href: HOME_HREF, label: HOME_LABEL, isCurrent: false }, ...items];
  })();

  return (
    <SidebarProvider>
      <UserProvider userId={userId}>
        <AppSidebar user={user} />
        <SidebarInset>
          {/* <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30"> */}
          {/* Loader overlay - always rendered in same position to avoid hydration mismatch */}
          {/* {showLoader && (
            <div suppressHydrationWarning>
              <Loader fullScreen text="Učitavanje..." />
            </div>
          )} */}
          {/* Mobile Header */}
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbItems.map((item, index) => (
                    <span key={item.href + index} className="contents">
                      <BreadcrumbItem className="flex">
                        {item.isCurrent ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={item.href}>{item.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbItems.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </span>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          {/* <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
            <div className="font-bold text-xl text-white tracking-tighter flex items-center gap-2">
              <Image
                src="/viralio-icon-512.png"
                alt="Viralio"
                width={32}
                height={32}
              />
              Viralio
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 transition-transform duration-300"
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6 flex flex-col gap-1.5 justify-center">
                <span
                  className={`left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isSidebarOpen ? 'rotate-45 translate-y-2' : 'translate-y-0'
                  }`}
                />
                <span
                  className={`left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isSidebarOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isSidebarOpen
                      ? '-rotate-45 -translate-y-2'
                      : 'translate-y-0'
                  }`}
                />
              </div>
            </button>
          </div> */}

          {/* Backdrop overlay when sidebar is open */}
          {isSidebarOpen && (
            <div
              className="fixed top-[57px] bottom-0 left-0 right-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className="flex h-full">
            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 lg:pt-2 pb-0 overflow-x-hidden h-full overflow-y-auto">
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
          {/* </div> */}
        </SidebarInset>
      </UserProvider>
    </SidebarProvider>
  );
}
