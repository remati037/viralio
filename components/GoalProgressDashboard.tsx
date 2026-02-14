'use client';

import { isLongFormHidden } from '@/lib/utils/featureFlags';
import { Target, Video, Youtube } from 'lucide-react';
import { Card, CardTitle } from './ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface GoalProgressDashboardProps {
  progress: {
    completedShort: number;
    completedLong: number;
    requiredShort: number;
    requiredLong: number;
    notification: string | null;
  };
  goals: {
    monthlyGoalShort: number;
    monthlyGoalLong: number;
  };
}

export function ProgressBar({
  current,
  goal,
  colorClass,
  isComplete,
}: {
  current: number;
  goal: number;
  colorClass: string;
  isComplete: boolean;
}) {
  const percent = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full h-2 md:h-2.5 bg-muted/80 rounded-full overflow-hidden cursor-default border border-border/30 shadow-inner min-w-0">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out min-w-0 ${colorClass} ${
              isComplete ? 'drop-shadow-sm' : ''
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-medium">
        {percent.toFixed(0)}% cilja
        {current >= goal && ' — završeno!'}
      </TooltipContent>
    </Tooltip>
  );
}

export default function GoalProgressDashboard({
  progress,
  goals,
}: GoalProgressDashboardProps) {
  const { completedShort, completedLong, notification } = progress;
  const { monthlyGoalShort, monthlyGoalLong } = goals;

  const shortPercent =
    monthlyGoalShort > 0 ? (completedShort / monthlyGoalShort) * 100 : 0;
  const longPercent =
    monthlyGoalLong > 0 ? (completedLong / monthlyGoalLong) * 100 : 0;

  const getBarColor = (current: number, goal: number) => {
    const percent = goal > 0 ? current / goal : 0;
    if (percent >= 1) return 'bg-chart-2';
    if (percent >= 0.75) return 'bg-chart-1';
    if (notification && notification.includes('ubrzati'))
      return 'bg-destructive';
    return 'bg-chart-3';
  };

  const isSuccessNotification = notification?.includes('Čestitamo');

  return (
    <TooltipProvider>
      <Card className="mb-3 md:mb-6 p-3 md:p-6 md:pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 md:mb-4">
          <CardTitle className="text-base md:text-xl font-bold flex items-center gap-2">
            <Target size={14} className="text-chart-3 shrink-0 md:w-4 md:h-4" />{' '}
            <span className="truncate">Progres ciljeva</span>
          </CardTitle>

          {/* {notification && (
            <Badge
              variant={isSuccessNotification ? 'default' : 'destructive'}
              className={`py-1 px-2 md:py-1.5 md:px-3 gap-1.5 md:gap-2 text-xs md:text-sm shrink-0 self-start sm:self-auto animate-pulse ${
                isSuccessNotification
                  ? 'bg-chart-2/20 text-chart-2 border-chart-2/50'
                  : ''
              }`}
            >
              <Zap size={12} className="md:w-3.5 md:h-3.5" />
              <span className="truncate max-w-[180px] md:max-w-none">
                {notification}
              </span>
            </Badge>
          )} */}
        </div>
        <div
          className={`grid gap-3 md:gap-8 min-w-0 ${
            isLongFormHidden() ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex justify-between items-center gap-2 min-w-0">
              <span className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 truncate">
                <Video
                  size={16}
                  className="text-chart-5 shrink-0 md:w-5 md:h-5"
                />
                Kratka forma
              </span>
              <span className="text-xs md:text-sm font-semibold tabular-nums shrink-0">
                {completedShort}/{monthlyGoalShort}
                {monthlyGoalShort > 0 && (
                  <span className="text-muted-foreground font-normal md:inline hidden ml-1">
                    ({shortPercent.toFixed(0)}%)
                  </span>
                )}
              </span>
            </div>
            <ProgressBar
              current={completedShort}
              goal={monthlyGoalShort}
              colorClass={getBarColor(completedShort, monthlyGoalShort)}
              isComplete={completedShort >= monthlyGoalShort}
            />
          </div>

          {!isLongFormHidden() && (
            <div className="space-y-1.5 min-w-0">
              <div className="flex justify-between items-center gap-2 min-w-0">
                <span className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 truncate">
                  <Youtube
                    size={16}
                    className="text-chart-2 shrink-0 md:w-5 md:h-5"
                  />
                  Duga forma
                </span>
                <span className="text-xs md:text-sm font-semibold tabular-nums shrink-0">
                  {completedLong}/{monthlyGoalLong}
                  {monthlyGoalLong > 0 && (
                    <span className="text-muted-foreground font-normal md:inline hidden ml-1">
                      ({longPercent.toFixed(0)}%)
                    </span>
                  )}
                </span>
              </div>
              <ProgressBar
                current={completedLong}
                goal={monthlyGoalLong}
                colorClass={getBarColor(completedLong, monthlyGoalLong)}
                isComplete={completedLong >= monthlyGoalLong}
              />
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}
