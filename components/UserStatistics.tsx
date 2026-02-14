'use client';

import { createClient } from '@/lib/supabase/client';
import { isLongFormHidden } from '@/lib/utils/featureFlags';
import { initializeUserStatistics } from '@/lib/utils/userStatistics';
import type { Task, UserStatistics } from '@/types';
import { CheckCircle, Clock, Eye, FileText, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProgressBar } from './GoalProgressDashboard';
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
    (t) => t.format === 'Kratka Forma',
  ).length;
  const longFormTasks = tasks.filter((t) => t.format === 'Duga Forma').length;

  // Calculate views, engagement, conversions from published tasks
  const publishedTasksWithResults = tasks.filter(
    (t) =>
      t.status === 'published' &&
      (t.result_views || t.result_engagement || t.result_conversions),
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
    {} as Record<string, number>,
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

  const cardBase =
    'bg-gradient-to-b from-background to-muted border border-border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cardBase}>
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-medium text-foreground mb-1">
                  Ukupno skripti
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {totalTasks}
                </p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-chart-1/15 border border-border flex items-center justify-center">
                <FileText className="text-chart-1" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cardBase}>
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-medium text-foreground mb-1">
                  Objavljeno
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {publishedTasks}
                </p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-chart-2/15 border border-border flex items-center justify-center">
                <CheckCircle className="text-chart-2" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cardBase}>
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-medium text-foreground mb-1">
                  Ukupno pregleda
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {formatNumber(displayTotalViews)}
                </p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-chart-4/15 border border-border flex items-center justify-center">
                <Eye className="text-chart-4" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cardBase}>
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-medium text-foreground mb-1">
                  Engagement
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {formatNumber(displayTotalEngagement)}
                </p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-chart-5/15 border border-border flex items-center justify-center">
                <Heart className="text-chart-5" size={22} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cardBase}>
          <CardHeader className="p-4 md:p-5 md:pb-0">
            <CardTitle className="text-base font-medium text-foreground mb-1">
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-5 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums mb-1">
              {engagementRate}%
            </div>
            <p className="text-sm text-muted-foreground">
              {displayTotalEngagement.toLocaleString()} od{' '}
              {displayTotalViews.toLocaleString()} pregleda
            </p>
          </CardContent>
        </Card>

        <Card className={cardBase}>
          <CardHeader className="p-4 md:p-5 md:pb-0">
            <CardTitle className="text-base font-medium text-foreground mb-1">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-5 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums mb-1">
              {conversionRate}%
            </div>
            <p className="text-sm text-muted-foreground">
              {displayTotalConversions.toLocaleString()} konverzija od{' '}
              {displayTotalViews.toLocaleString()} pregleda
            </p>
          </CardContent>
        </Card>

        <Card className={cardBase}>
          <CardHeader className="p-4 md:p-5 md:pb-0">
            <CardTitle className="text-base font-medium text-foreground mb-1">
              Ukupno Konverzija
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-5 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums mb-1">
              {formatNumber(displayTotalConversions)}
            </div>
            <p className="text-sm text-muted-foreground">
              Ukupno konverzija iz svih objavljenih zadataka
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Breakdown */}
      <Card className={cardBase}>
        <CardHeader className="p-4 md:p-5 md:pb-0">
          <CardTitle className="text-base font-medium text-foreground mb-1">
            Status zadataka
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Pregled zadataka po statusu
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-5 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-foreground" size={14} />
                <span className="text-sm text-foreground">Ideje</span>
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {ideaTasks}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalTasks > 0
                  ? ((ideaTasks / totalTasks) * 100).toFixed(0)
                  : 0}
                % od {totalTasks} ukupno
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-foregorund" size={14} />
                <span className="text-sm text-foreground">Spremno</span>
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {readyTasks}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalTasks > 0
                  ? ((readyTasks / totalTasks) * 100).toFixed(0)
                  : 0}
                % od {totalTasks} ukupno
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-foreground" size={14} />
                <span className="text-sm text-foreground">Zakazano</span>
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {scheduledTasks}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalTasks > 0
                  ? ((scheduledTasks / totalTasks) * 100).toFixed(0)
                  : 0}
                % od {totalTasks} ukupno
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-foreground" size={14} />
                <span className="text-sm text-foreground">Objavljeno</span>
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {publishedTasks}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`${cardBase} ${isLongFormHidden() ? 'col-span-2' : ''}`}
        >
          <CardHeader className="p-4 md:p-5 md:pb-0">
            <CardTitle className="text-base font-medium text-foreground mb-1">
              Kratka forma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-5 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums mb-2">
              {shortFormTasks}
            </div>
            <ProgressBar
              current={shortFormTasks}
              goal={totalTasks}
              colorClass="bg-chart-1"
              isComplete={shortFormTasks >= totalTasks}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {totalTasks > 0
                ? ((shortFormTasks / totalTasks) * 100).toFixed()
                : 0}
              % od ukupno zadataka
            </p>
          </CardContent>
        </Card>

        <Card
          className={`${cardBase} ${isLongFormHidden() ? 'hidden' : 'block'}`}
        >
          <CardHeader className="p-4 md:p-5 pb-2">
            <CardTitle className="text-base font-medium text-foreground mb-1">
              Duga forma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-5 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums mb-2">
              {longFormTasks}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-chart-2 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${totalTasks > 0 ? (longFormTasks / totalTasks) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {totalTasks > 0
                ? ((longFormTasks / totalTasks) * 100).toFixed()
                : 0}
              % od ukupno zadataka
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Statistics */}
        <Card className={cardBase}>
          <CardHeader className="p-4 md:p-5 md:pb-0">
            <CardTitle className="text-base font-medium text-foreground mb-1">
              Statistika za tekući mesec
            </CardTitle>
            <CardDescription className="text-muted-foreground capitalize">
              {new Date().toLocaleDateString('sr-Latn-RS', {
                month: 'long',
                year: 'numeric',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-5 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <div className="text-sm text-foreground mb-1">
                  Kreirane skripte
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {tasksThisMonth}
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <div className="text-sm text-foreground mb-1">
                  Objavljene skripte
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {publishedThisMonth}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <Card className={cardBase}>
            <CardHeader className="p-4 md:p-5 md:pb-0">
              <CardTitle className="text-base font-medium text-foreground mb-1">
                Najčešće kategorije
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Top 5 kategorija po broju zadataka
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-5 pt-0">
              <div className="space-y-2">
                {topCategories.map(([category, count], index) => (
                  <div
                    key={category}
                    className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-chart-5/20 border border-border flex items-center justify-center text-chart-5 font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className="text-foreground font-medium capitalize text-sm truncate">
                        {category}
                      </span>
                    </div>
                    <div className="text-muted-foreground font-medium text-sm shrink-0 ml-2">
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
