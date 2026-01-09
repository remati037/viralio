'use client';

import { createClient } from '@/lib/supabase/client';
import { initializeUserStatistics } from '@/lib/utils/userStatistics';
import type { Task, UserStatistics } from '@/types';
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Heart,
  Target,
  TrendingUp,
  Video,
  Youtube,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import Skeleton from './ui/skeleton';

interface UserStatisticsProps {
  userId: string;
}

interface StatisticsData {
  userStats: UserStatistics | null;
  tasks: Task[];
  loading: boolean;
}

export default function UserStatisticsComponent({
  userId,
}: UserStatisticsProps) {
  const [stats, setStats] = useState<StatisticsData>({
    userStats: null,
    tasks: [],
    loading: true,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchStatistics();
  }, [userId]);

  const fetchStatistics = async () => {
    try {
      // Initialize statistics if they don't exist and calculate from tasks
      await initializeUserStatistics(userId);

      // Fetch user statistics
      const { data: userStats, error: statsError } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching user statistics:', statsError);
      }

      // Fetch all tasks for detailed statistics (including category)
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*, category:task_categories(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setStats({
        userStats: userStats || null,
        tasks: tasks || [],
        loading: false,
      });
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <div className="space-y-6">
        <Skeleton height={200} />
        <Skeleton height={200} />
        <Skeleton height={200} />
      </div>
    );
  }

  const tasks = stats.tasks;
  const userStats = stats.userStats;

  // Calculate statistics from tasks
  const totalTasks = tasks.length;
  const publishedTasks = tasks.filter((t) => t.status === 'published').length;
  const readyTasks = tasks.filter((t) => t.status === 'ready').length;
  const scheduledTasks = tasks.filter((t) => t.status === 'scheduled').length;
  const ideaTasks = tasks.filter((t) => t.status === 'idea').length;

  // Format statistics
  const shortFormTasks = tasks.filter(
    (t) => t.format === 'Kratka Forma'
  ).length;
  const longFormTasks = tasks.filter((t) => t.format === 'Duga Forma').length;

  // Calculate views, engagement, conversions from published tasks
  const publishedTasksWithResults = tasks.filter(
    (t) =>
      t.status === 'published' &&
      (t.result_views || t.result_engagement || t.result_conversions)
  );

  const totalViews = publishedTasksWithResults.reduce((sum, task) => {
    return sum + parseInt(task.result_views || '0', 10);
  }, 0);

  const totalEngagement = publishedTasksWithResults.reduce((sum, task) => {
    return sum + parseInt(task.result_engagement || '0', 10);
  }, 0);

  const totalConversions = publishedTasksWithResults.reduce((sum, task) => {
    return sum + parseInt(task.result_conversions || '0', 10);
  }, 0);

  // Calculate engagement rate (engagement / views * 100)
  const engagementRate =
    totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(1) : '0.00';

  // Calculate conversion rate (conversions / views * 100)
  const conversionRate =
    totalViews > 0
      ? ((totalConversions / totalViews) * 100).toFixed(1)
      : '0.00';

  // Get tasks by category
  const tasksByCategory = tasks.reduce(
    (acc, task) => {
      const categoryName = task.category?.name || 'Bez kategorije';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topCategories = Object.entries(tasksByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Get monthly statistics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const tasksThisMonth = tasks.filter((task) => {
    const taskDate = new Date(task.created_at);
    return (
      taskDate.getMonth() === currentMonth &&
      taskDate.getFullYear() === currentYear
    );
  }).length;

  const publishedThisMonth = tasks.filter((task) => {
    if (task.status !== 'published' || !task.publish_date) return false;
    const publishDate = new Date(task.publish_date);
    return (
      publishDate.getMonth() === currentMonth &&
      publishDate.getFullYear() === currentYear
    );
  }).length;

  // Get views from user_statistics if available, otherwise use calculated
  const displayTotalViews = userStats?.total_views
    ? parseInt(userStats.total_views, 10)
    : totalViews;

  const displayTotalEngagement = userStats?.total_engagement
    ? parseInt(userStats.total_engagement, 10)
    : totalEngagement;

  const displayTotalConversions = userStats?.total_conversions
    ? parseInt(userStats.total_conversions, 10)
    : totalConversions;

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Format task count with correct Serbian pluralization
  const formatTaskCount = (count: number) => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    // Special cases: 11-14 always use "zadataka" (genitive plural)
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return `${count} zadataka`;
    }

    // Singular: ending in 1 (except 11)
    if (lastDigit === 1) {
      return `${count} zadatak`;
    }

    // Genitive singular: ending in 2, 3, 4 (except 12, 13, 14)
    if (lastDigit >= 2 && lastDigit <= 4) {
      return `${count} zadatka`;
    }

    // Genitive plural: everything else (5-9, 0, 11-14 already handled)
    return `${count} zadataka`;
  };

  return (
    <div className="space-y-3">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md text-slate-400 mb-2">Ukupno skripti</p>
                <p className="text-2xl font-bold text-white">{totalTasks}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <FileText className="text-blue-400" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md text-slate-400 mb-2">Objavljeno</p>
                <p className="text-2xl font-bold text-white">
                  {publishedTasks}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="text-green-400" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md text-slate-400 mb-2">Ukupno pregleda</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(displayTotalViews)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Eye className="text-purple-400" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md text-slate-400 mb-2">Engagement</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(displayTotalEngagement)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Heart className="text-pink-400" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="p-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <TrendingUp className="text-green-400" size={20} />
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-white mb-2">
              {engagementRate}%
            </div>
            <p className="text-sm text-slate-400">
              {displayTotalEngagement.toLocaleString()} od{' '}
              {displayTotalViews.toLocaleString()} pregleda
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="p-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Zap className="text-yellow-400" size={20} />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-white mb-2">
              {conversionRate}%
            </div>
            <p className="text-sm text-slate-400">
              {displayTotalConversions.toLocaleString()} konverzija od{' '}
              {displayTotalViews.toLocaleString()} pregleda
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="p-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Activity className="text-blue-400" size={20} />
              Ukupno Konverzija
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-white mb-2">
              {formatNumber(displayTotalConversions)}
            </div>
            <p className="text-sm text-slate-400">
              Ukupno konverzija iz svih objavljenih zadataka
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Breakdown */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="p-4">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="text-blue-400" size={20} />
            Status zadataka
          </CardTitle>
          <CardDescription className="text-slate-400">
            Pregled zadataka po statusu
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            <div className="bg-slate-900 p-3 rounded-md border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-slate-400" size={14} />
                <span className="text-sm text-slate-400">Ideje</span>
              </div>
              <div className="text-2xl font-bold text-white">{ideaTasks}</div>
              <div className="text-xs text-slate-500 mt-1">
                {totalTasks > 0
                  ? ((ideaTasks / totalTasks) * 100).toFixed(0)
                  : 0}
                % od {totalTasks} ukupno
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-md border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-400" size={14} />
                <span className="text-sm text-slate-400">Spremno</span>
              </div>
              <div className="text-2xl font-bold text-white">{readyTasks}</div>
              <div className="text-xs text-slate-500 mt-1">
                {totalTasks > 0
                  ? ((readyTasks / totalTasks) * 100).toFixed(0)
                  : 0}
                % od {totalTasks} ukupno
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-md border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-yellow-400" size={14} />
                <span className="text-sm text-slate-400">Zakazano</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {scheduledTasks}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {totalTasks > 0
                  ? ((scheduledTasks / totalTasks) * 100).toFixed(0)
                  : 0}
                % od {totalTasks} ukupno
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-md border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-blue-400" size={14} />
                <span className="text-sm text-slate-400">Objavljeno</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {publishedTasks}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {totalTasks > 0
                  ? ((publishedTasks / totalTasks) * 100).toFixed(0)
                  : 0}
                % od {totalTasks} ukupno
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="p-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Video className="text-red-400" size={20} />
              Kratka forma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-white mb-2">
              {shortFormTasks}
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5">
              <div
                className="bg-red-500 h-1.5 rounded-full"
                style={{
                  width: `${totalTasks > 0 ? (shortFormTasks / totalTasks) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {totalTasks > 0
                ? ((shortFormTasks / totalTasks) * 100).toFixed()
                : 0}
              % od ukupno zadataka
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="p-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Youtube className="text-green-400" size={20} />
              Duga forma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-white mb-2">
              {longFormTasks}
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{
                  width: `${totalTasks > 0 ? (longFormTasks / totalTasks) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {totalTasks > 0
                ? ((longFormTasks / totalTasks) * 100).toFixed()
                : 0}
              % od ukupno zadataka
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Monthly Statistics */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="p-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="text-purple-400" size={20} />
              Statistika za tekući mesec
            </CardTitle>
            <CardDescription className="text-slate-400 capitalize">
              {new Date().toLocaleDateString('sr-Latn-RS', {
                month: 'long',
                year: 'numeric',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900 p-4 rounded-md border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">
                  Kreirane skripte
                </div>
                <div className="text-2xl font-bold text-white">
                  {tasksThisMonth}
                </div>
              </div>
              <div className="bg-slate-900 p-4 rounded-md border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">
                  Objavljene skripte
                </div>
                <div className="text-2xl font-bold text-white">
                  {publishedThisMonth}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="p-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="text-orange-400" size={16} />
                Najčešće kategorije
              </CardTitle>
              <CardDescription className="text-slate-400">
                Top 5 kategorija po broju zadataka
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {topCategories.map(([category, count], index) => (
                  <div
                    key={category}
                    className="flex items-center justify-between bg-slate-900 p-2 rounded-md border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className="text-white font-medium capitalize text-sm">
                        {category}
                      </span>
                    </div>
                    <div className="text-slate-400 font-medium text-sm">
                      {formatTaskCount(count)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
