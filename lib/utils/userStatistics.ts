import { createClient } from '@/lib/supabase/client';

/**
 * Calculate and update user statistics based on tasks
 */
export async function updateUserStatistics(userId: string) {
  const supabase = createClient();

  try {
    // Fetch all user tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (tasksError) {
      console.error('Error fetching tasks for statistics:', tasksError);
      return { error: tasksError };
    }

    // Calculate statistics
    const totalTasks = tasks?.length || 0;
    const publishedTasks = tasks?.filter((t) => t.status === 'published').length || 0;

    // Calculate views, engagement, conversions from published tasks
    const publishedTasksWithResults = tasks?.filter(
      (t) =>
        t.status === 'published' &&
        (t.result_views || t.result_engagement || t.result_conversions)
    ) || [];

    const totalViews = publishedTasksWithResults.reduce((sum, task) => {
      return sum + parseInt(task.result_views || '0', 10);
    }, 0);

    const totalEngagement = publishedTasksWithResults.reduce((sum, task) => {
      return sum + parseInt(task.result_engagement || '0', 10);
    }, 0);

    const totalConversions = publishedTasksWithResults.reduce((sum, task) => {
      return sum + parseInt(task.result_conversions || '0', 10);
    }, 0);

    const statisticsData = {
      user_id: userId,
      total_tasks: totalTasks,
      published_tasks: publishedTasks,
      total_views: totalViews.toString(),
      total_engagement: totalEngagement.toString(),
      total_conversions: totalConversions.toString(),
      last_active_at: new Date().toISOString(),
    };

    // Use UPSERT to either insert or update (handles race conditions)
    const { data, error: upsertError } = await supabase
      .from('user_statistics')
      .upsert(statisticsData, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting user statistics:', upsertError);
      return { error: upsertError };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error in updateUserStatistics:', error);
    return { error };
  }
}

/**
 * Initialize user statistics if they don't exist
 * Uses updateUserStatistics which handles upsert automatically
 */
export async function initializeUserStatistics(userId: string) {
  // Simply call updateUserStatistics which will upsert (insert or update)
  return await updateUserStatistics(userId);
}
