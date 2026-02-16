'use client';

import { createClient } from '@/lib/supabase/client';
import type { Payment, Profile, UserStatistics } from '@/types';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Database,
  Edit,
  MoreVertical,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import AdminCaseStudyCreation from './AdminCaseStudyCreation';
import AdminTemplateManagement from './AdminTemplateManagement';
import CreateUserModal from './CreateUserModal';
import DeleteUserModal from './DeleteUserModal';
import UpdateUserModal from './UpdateUserModal';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import Loader from './ui/loader';

interface AdminDashboardProps {
  userId: string;
}

type UserWithData = Profile & {
  email?: string;
  email_confirmed?: boolean;
  statistics?: UserStatistics;
  payments?: Payment[];
  realStats?: {
    total_tasks: number;
    published_tasks: number;
    total_views: number;
    total_engagement: number;
    total_conversions: number;
  };
};

export default function AdminDashboard({ userId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'users' | 'templates' | 'case-studies' | 'sanity'
  >('users');
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [syncingCaseStudies, setSyncingCaseStudies] = useState(false);
  const [users, setUsers] = useState<UserWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    pageSize: 10,
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPro: 0,
    totalTasks: 0,
    totalViews: 0,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithData | null>(null);
  const [userToUpdate, setUserToUpdate] = useState<UserWithData | null>(null);
  const [userRealStatistics, setUserRealStatistics] = useState<{
    total_tasks: number;
    published_tasks: number;
    total_views: string;
    total_engagement: string;
    total_conversions: string;
  } | null>(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const supabase = createClient();

  const fetchUsers = useCallback(
    async (page: number, search: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: '10',
        });
        if (search) params.set('search', search);
        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data.users);
        setPagination({
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          pageSize: data.pagination.pageSize,
        });
        if (data.stats) setStats(data.stats);
      } catch (error: any) {
        toast.error('Greška pri učitavanju korisnika', {
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsers(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchUsers]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserRealStatistics(selectedUser.id);
    } else {
      setUserRealStatistics(null);
    }
  }, [selectedUser]);

  const fetchUserRealStatistics = async (userId: string) => {
    setLoadingStatistics(true);
    try {
      // Fetch all tasks for this user (excluding admin case studies)
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(
          'id, status, result_views, result_engagement, result_conversions, is_admin_case_study',
        )
        .eq('user_id', userId);

      if (tasksError) throw tasksError;

      // Filter out admin case studies - only count user's own tasks
      const userTasks = tasks?.filter((t) => !t.is_admin_case_study) || [];

      // Calculate real statistics from tasks
      const totalTasks = userTasks.length;
      const publishedTasks =
        userTasks.filter((t) => t.status === 'published').length || 0;

      // Sum up views, engagement, and conversions from published tasks
      let totalViews = 0;
      let totalEngagement = 0;
      let totalConversions = 0;

      userTasks.forEach((task) => {
        if (task.status === 'published') {
          // Parse numeric values from strings, defaulting to 0 if null or invalid
          const views = parseInt(task.result_views || '0', 10) || 0;
          const engagement = parseInt(task.result_engagement || '0', 10) || 0;
          const conversions = parseInt(task.result_conversions || '0', 10) || 0;

          totalViews += views;
          totalEngagement += engagement;
          totalConversions += conversions;
        }
      });

      setUserRealStatistics({
        total_tasks: totalTasks,
        published_tasks: publishedTasks,
        total_views: totalViews.toString(),
        total_engagement: totalEngagement.toString(),
        total_conversions: totalConversions.toString(),
      });
    } catch (error: any) {
      toast.error('Greška pri učitavanju statistika', {
        description: error.message,
      });
      setUserRealStatistics(null);
    } finally {
      setLoadingStatistics(false);
    }
  };

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
  const columns = useMemo<
    ColumnDef<UserWithData>[]
  >(
    () => [
      {
        accessorKey: 'business_name',
        size: 300,
        minSize: 250,
        maxSize: 400,
        header: () => (
          <span className="text-muted-foreground text-sm font-medium">Korisnik</span>
        ),
        cell: ({ row }) => {
          const user = row.original;
          const email = user.email;
          return (
            <div className="min-w-[250px]">
              <div className="text-foreground font-medium flex items-center gap-2">
                {user.business_name || 'Nema imena'}
                {user.email_confirmed === false && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-destructive/20 text-destructive border border-border">
                    Email Nije Potvrđen
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground min-h-[16px]">
                {email ? (
                  <span>{email}</span>
                ) : (
                  <span className="invisible">Loading...</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'tier',
        size: 120,
        header: () => (
          <span className="text-muted-foreground text-sm font-medium">Tier</span>
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-bold border border-border ${
                user.tier === 'admin'
                  ? 'bg-primary/20 text-primary'
                  : user.tier === 'pro'
                    ? 'bg-chart-4/20 text-chart-4'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {user.tier?.toUpperCase() || 'PRO'}
            </span>
          );
        },
      },
      {
        id: 'tasks',
        size: 100,
        header: () => (
          <span className="text-muted-foreground text-sm font-medium">
            <span className="hidden md:inline">Zadaci</span>
            <span className="md:hidden">Zad.</span>
          </span>
        ),
        accessorFn: (row) => row.realStats?.total_tasks || 0,
        cell: ({ row }) => {
          const user = row.original;
          const totalTasks = user.realStats?.total_tasks || 0;
          const publishedTasks = user.realStats?.published_tasks || 0;
          return (
            <span className="text-foreground text-sm">
              <span className="hidden md:inline">
                {totalTasks} / {publishedTasks}
              </span>
              <span className="md:hidden">
                {totalTasks}/{publishedTasks}
              </span>
            </span>
          );
        },
      },
      {
        id: 'views',
        size: 100,
        header: () => (
          <span className="text-muted-foreground text-sm font-medium">
            <span className="hidden md:inline">Pregledi</span>
            <span className="md:hidden">Preg.</span>
          </span>
        ),
        accessorFn: (row) => row.realStats?.total_views || 0,
        cell: ({ row }) => {
          const user = row.original;
          const views = user.realStats?.total_views || 0;
          const shortViews =
            views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views.toString();
          return (
            <span className="text-foreground text-sm">
              <span className="hidden md:inline">{views.toLocaleString()}</span>
              <span className="md:hidden">{shortViews}</span>
            </span>
          );
        },
      },
      {
        id: 'actions',
        size: 80,
        header: '',
        cell: ({ row }) => {
          const user = row.original;
          const isOpen = openActionMenu === user.id;
          return (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenActionMenu(isOpen ? null : user.id)}
                className="p-1.5"
              >
                <MoreVertical size={16} />
              </Button>
              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpenActionMenu(null)}
                  />
                  <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-lg shadow-xl min-w-[160px]">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setOpenActionMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      Detalji
                    </button>
                    <button
                      onClick={() => {
                        setUserToUpdate(user);
                        setIsUpdateModalOpen(true);
                        setOpenActionMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Edit size={14} /> Ažuriraj
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(user);
                        setIsDeleteModalOpen(true);
                        setOpenActionMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Obriši
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [openActionMenu],
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <Loader fullScreen text="Učitavanje korisnika..." />;
  }

  return (
    <div className="space-y-6 md:space-y-8 min-w-0">
      <header>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Shield className="text-primary" size={24} /> Admin Dashboard
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Upravljanje korisnicima, statistikama i šablonima
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-y-2 gap-x-0 border-b border-border flex-wrap">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users size={16} /> Korisnici
        </button>
        {/* <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText size={16} /> Šabloni
        </button>
        <button
          onClick={() => setActiveTab('case-studies')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'case-studies'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList size={16} /> Studije Slučaja
        </button> */}
        <button
          onClick={() => setActiveTab('sanity')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'sanity'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Database size={16} /> Sanity CMS
        </button>
      </div>

      {activeTab === 'templates' && <AdminTemplateManagement userId={userId} />}
      {activeTab === 'case-studies' && (
        <AdminCaseStudyCreation userId={userId} />
      )}

      {activeTab === 'sanity' && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-b from-background to-muted border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Database size={20} /> Sanity CMS Integracija
              </CardTitle>
              <CardDescription>
                Upravljajte šablonima i studijama slučaja kroz Sanity CMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <h3 className="text-foreground font-medium mb-2">Sanity Studio</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Prijavite se na Sanity.io da biste kreirali i uređivali
                    šablone i studije slučaja.
                  </p>
                  <Button
                    onClick={() =>
                      window.open('https://www.sanity.io/manage', '_blank')
                    }
                  >
                    <Database size={16} className="mr-2" /> Otvori Sanity Studio
                  </Button>
                  <p className="text-muted-foreground text-xs mt-2">
                    Ili direktno:{' '}
                    <a
                      href="https://www.sanity.io/manage"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      sanity.io/manage
                    </a>
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <h3 className="text-foreground font-medium mb-2">
                    Sinhronizacija sa Supabase
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Sinhronizujte sadržaj iz Sanity CMS-a u Supabase bazu
                    podataka.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={async () => {
                        setSyncingTemplates(true);
                        try {
                          const response = await fetch(
                            '/api/sanity/sync-templates',
                            {
                              method: 'POST',
                            },
                          );
                          const data = await response.json();
                          if (response.ok) {
                            toast.success('Šabloni uspešno sinhronizovani', {
                              description: `Sinhronizovano ${data.synced} šablona.`,
                            });
                            if (data.errors && data.errors.length > 0) {
                              console.error('Sync errors:', data.errors);
                            }
                          } else {
                            throw new Error(
                              data.error || 'Greška pri sinhronizaciji',
                            );
                          }
                        } catch (error: any) {
                          toast.error('Greška pri sinhronizaciji šablona', {
                            description: error.message,
                          });
                        } finally {
                          setSyncingTemplates(false);
                        }
                      }}
                      disabled={syncingTemplates}
                      variant="default"
                    >
                      <RefreshCw
                        size={16}
                        className={`mr-2 ${syncingTemplates ? 'animate-spin' : ''}`}
                      />
                      {syncingTemplates
                        ? 'Sinhronizacija...'
                        : 'Sinhronizuj Šablone'}
                    </Button>
                    <Button
                      onClick={async () => {
                        setSyncingCaseStudies(true);
                        try {
                          const response = await fetch(
                            '/api/sanity/sync-case-studies',
                            {
                              method: 'POST',
                            },
                          );
                          const data = await response.json();
                          if (response.ok) {
                            toast.success(
                              'Studije slučaja uspešno sinhronizovane',
                              {
                                description: `Sinhronizovano ${data.synced} studija slučaja.`,
                              },
                            );
                            if (data.errors && data.errors.length > 0) {
                              console.error('Sync errors:', data.errors);
                            }
                          } else {
                            throw new Error(
                              data.error || 'Greška pri sinhronizaciji',
                            );
                          }
                        } catch (error: any) {
                          toast.error(
                            'Greška pri sinhronizaciji studija slučaja',
                            {
                              description: error.message,
                            },
                          );
                        } finally {
                          setSyncingCaseStudies(false);
                        }
                      }}
                      disabled={syncingCaseStudies}
                      variant="secondary"
                    >
                      <RefreshCw
                        size={16}
                        className={`mr-2 ${syncingCaseStudies ? 'animate-spin' : ''}`}
                      />
                      {syncingCaseStudies
                        ? 'Sinhronizacija...'
                        : 'Sinhronizuj Studije Slučaja'}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <h3 className="text-foreground font-medium mb-2">Uputstvo</h3>
                  <ol className="text-muted-foreground text-sm space-y-2 list-decimal list-inside">
                    <li>
                      Kliknite na "Otvori Sanity Studio" ili idite na{' '}
                      <a
                        href="https://www.sanity.io/manage"
                        target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      sanity.io/manage
                    </a>
                    </li>
                    <li>Prijavite se sa vašim Sanity nalogom</li>
                    <li>Izaberite vaš projekat iz liste projekata</li>
                    <li>
                      Kreirajte ili uredite šablone i studije slučaja u Sanity
                      Studio-u
                    </li>
                    <li>
                      Kliknite na dugme za sinhronizaciju ovde da biste preneli
                      izmene u Supabase
                    </li>
                    <li>
                      Izmene će biti dostupne u aplikaciji nakon sinhronizacije
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-b from-background to-muted border-border">
              <CardHeader className="p-3 md:p-4">
                <CardDescription className="text-sm">
                  <span className="md:inline">Ukupno korisnika</span>
                </CardDescription>
                <CardTitle className="text-xl md:text-2xl text-foreground">
                  {stats.totalUsers}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-gradient-to-b from-background to-muted border-border">
              <CardHeader className="p-3 md:p-4">
                <CardDescription className="text-sm">
                  <span className="md:inline">Pro korisnici</span>
                </CardDescription>
                <CardTitle className="text-xl md:text-2xl text-foreground">
                  {stats.totalPro}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-gradient-to-b from-background to-muted border-border">
              <CardHeader className="p-3 md:p-4">
                <CardDescription className="text-sm">
                  <span className="md:inline">Ukupno zadataka</span>
                </CardDescription>
                <CardTitle className="text-xl md:text-2xl text-foreground">
                  {stats.totalTasks}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-gradient-to-b from-background to-muted border-border">
              <CardHeader className="p-3 md:p-4">
                <CardDescription className="text-sm">
                  <span className="md:inline">Ukupno pregleda</span>
                </CardDescription>
                <CardTitle className="text-xl md:text-2xl text-foreground">
                  {stats.totalViews >= 1000
                    ? `${(stats.totalViews / 1000).toFixed(1)}k`
                    : stats.totalViews.toString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Search and Create User */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
            <Input
              placeholder="Pretraži korisnike..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-md"
            />
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1 justify-center sm:justify-start"
            >
              <Plus size={16} />
              <span className="sm:inline">Kreiraj korisnika</span>
            </Button>
          </div>

          {/* Users Table */}
          <Card className="bg-gradient-to-b from-background to-muted border-border">
            <CardHeader className="p-4">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users size={18} /> Svi korisnici
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {table.getRowModel().rows.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nema korisnika za prikaz
                  </div>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const user = row.original;
                    const email = user.email;
                    const isOpen = openActionMenu === user.id;
                    return (
                      <Card
                        key={row.id}
                        className="bg-muted/50 border-border p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-foreground font-medium flex items-center gap-2 mb-1">
                              <span className="truncate">
                                {user.business_name || 'Nema imena'}
                              </span>
                              {user.email_confirmed === false && (
                                <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-destructive/20 text-destructive border border-border flex-shrink-0">
                                  Email Nije Potvrđen
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground min-h-[16px] truncate">
                              {email || (
                                <span className="invisible">Loading...</span>
                              )}
                            </div>
                          </div>
                          <div className="relative ml-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setOpenActionMenu(isOpen ? null : user.id)
                              }
                              className="p-1.5"
                            >
                              <MoreVertical size={16} />
                            </Button>
                            {isOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenActionMenu(null)}
                                />
                                <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-lg shadow-xl min-w-[160px]">
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setOpenActionMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors flex items-center gap-2"
                                  >
                                    Detalji
                                  </button>
                                  <button
                                    onClick={() => {
                                      setUserToUpdate(user);
                                      setIsUpdateModalOpen(true);
                                      setOpenActionMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors flex items-center gap-2"
                                  >
                                    <Edit size={14} /> Ažuriraj
                                  </button>
                                  <button
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setIsDeleteModalOpen(true);
                                      setOpenActionMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors flex items-center gap-2"
                                  >
                                    <Trash2 size={14} /> Obriši
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground mb-1">Tier</div>
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold inline-block border border-border ${
                                user.tier === 'admin'
                                  ? 'bg-primary/20 text-primary'
                                  : user.tier === 'pro'
                                    ? 'bg-chart-4/20 text-chart-4'
                                    : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {user.tier?.toUpperCase() || 'PRO'}
                            </span>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Zadaci</div>
                            <div className="text-foreground font-medium">
                              {user.realStats?.total_tasks || 0}/
                              {user.realStats?.published_tasks || 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Pregledi</div>
                            <div className="text-foreground font-medium">
                              {(() => {
                                const views = user.realStats?.total_views || 0;
                                return views >= 1000
                                  ? `${(views / 1000).toFixed(1)}k`
                                  : views.toString();
                              })()}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="border-b border-border"
                      >
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="text-left p-3 text-muted-foreground text-sm font-medium"
                            style={{
                              width: header.getSize(),
                              minWidth: header.column.columnDef.minSize,
                              maxWidth: header.column.columnDef.maxSize,
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="p-8 text-center text-muted-foreground"
                        >
                          Nema korisnika za prikaz
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-border hover:bg-muted/50"
                        >
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
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Prikazano{' '}
                  {pagination.total === 0
                    ? '0'
                    : (currentPage - 1) * pagination.pageSize + 1}{' '}
                  -{' '}
                  {Math.min(
                    currentPage * pagination.pageSize,
                    pagination.total,
                  )}{' '}
                  od {pagination.total} korisnika
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Prethodna</span>
                    <span className="sm:hidden">Preth.</span>
                  </Button>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {currentPage} / {pagination.totalPages || 1}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(pagination.totalPages || 1, p + 1),
                      )
                    }
                    disabled={currentPage >= pagination.totalPages}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Sledeća</span>
                    <span className="sm:hidden">Sled.</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Details Modal */}
          {selectedUser &&
            typeof document !== 'undefined' &&
            createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-foreground">
                          {selectedUser.business_name || 'Korisnik'}
                        </CardTitle>
                        <CardDescription>
                          ID: {selectedUser.id}
                        </CardDescription>
                        {selectedUser.email && (
                          <CardDescription className="flex items-center gap-2">
                            Email: {selectedUser.email}
                            {selectedUser.email_confirmed === false && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-destructive/20 text-destructive border border-border">
                                Email Nije Potvrđen
                              </span>
                            )}
                            {selectedUser.email_confirmed === true && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-chart-2/20 text-chart-2 border border-border">
                                Email Potvrđen
                              </span>
                            )}
                          </CardDescription>
                        )}
                        {(selectedUser as any).has_unlimited_free && (
                          <div className="mt-2">
                            <span className="px-2 py-1 rounded text-xs font-bold bg-chart-2/20 text-chart-2 border border-border">
                              Neograničena Besplatna PRO Pretplata
                            </span>
                          </div>
                        )}
                        {(selectedUser as any).free_trial_ends_at && !(selectedUser as any).has_unlimited_free && (
                          <div className="mt-2">
                            <span className="px-2 py-1 rounded text-xs font-bold bg-chart-4/20 text-chart-4 border border-border">
                              Probni period do:{' '}
                              {new Date((selectedUser as any).free_trial_ends_at).toLocaleDateString('sr-RS', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedUser(null)}
                      >
                        ×
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-foreground font-bold mb-2">
                        Statistike
                      </h3>
                      {loadingStatistics ? (
                        <div className="text-muted-foreground text-sm">
                          Učitavanje statistika...
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/50 p-3 rounded-lg border border-border">
                            <div className="text-muted-foreground text-sm">
                              Ukupno Zadataka
                            </div>
                            <div className="text-foreground font-bold">
                              {userRealStatistics?.total_tasks || 0}
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg border border-border">
                            <div className="text-muted-foreground text-sm">
                              Objavljeno
                            </div>
                            <div className="text-foreground font-bold">
                              {userRealStatistics?.published_tasks || 0}
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg border border-border">
                            <div className="text-muted-foreground text-sm">
                              Pregledi
                            </div>
                            <div className="text-foreground font-bold">
                              {userRealStatistics?.total_views || '0'}
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg border border-border">
                            <div className="text-muted-foreground text-sm">
                              Angažman
                            </div>
                            <div className="text-foreground font-bold">
                              {userRealStatistics?.total_engagement || '0'}
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg border border-border">
                            <div className="text-muted-foreground text-sm">
                              Konverzije
                            </div>
                            <div className="text-foreground font-bold">
                              {userRealStatistics?.total_conversions || '0'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-foreground font-bold mb-2">
                        Platni Istorija
                      </h3>
                      <div className="space-y-2">
                        {selectedUser.payments &&
                        selectedUser.payments.length > 0 ? (
                          selectedUser.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="bg-muted/50 p-3 rounded-lg border border-border flex justify-between"
                            >
                              <div>
                                <div className="text-foreground font-medium">
                                  ${payment.amount} - {payment.status}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {new Date(
                                    payment.created_at,
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {payment.tier_at_payment?.toUpperCase()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground text-sm">
                            Nema platnih podataka
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>,
              document.body,
            )}

          {/* Create User Modal */}
          <CreateUserModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onUserCreated={() => fetchUsers(currentPage, debouncedSearch)}
          />

          {/* Delete User Modal */}
          <DeleteUserModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setUserToDelete(null);
            }}
            onUserDeleted={() => fetchUsers(currentPage, debouncedSearch)}
            user={
              userToDelete
                ? {
                    id: userToDelete.id,
                    email: userToDelete.email,
                    business_name: userToDelete.business_name || undefined,
                  }
                : null
            }
          />

          {/* Update User Modal */}
          <UpdateUserModal
            isOpen={isUpdateModalOpen}
            onClose={() => {
              setIsUpdateModalOpen(false);
              setUserToUpdate(null);
            }}
            onUserUpdated={() => fetchUsers(currentPage, debouncedSearch)}
            user={
              userToUpdate
                ? {
                    ...userToUpdate,
                    email: userToUpdate.email,
                    email_confirmed: userToUpdate.email_confirmed,
                  }
                : null
            }
          />
        </>
      )}
    </div>
  );
}
