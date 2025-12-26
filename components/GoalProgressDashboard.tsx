'use client';

import { Target, Video, Youtube, Zap } from 'lucide-react';

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
    if (percent >= 1) return 'bg-emerald-500';
    if (percent >= 0.75) return 'bg-blue-500';
    if (notification && notification.includes('ubrzati')) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 mb-4 md:mb-8 shadow-inner">
      <div className="flex md:flex-row flex-col justify-between md:items-center items-start mb-4 gap-2">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Target size={16} className="text-yellow-400" /> Progres mesečnih
          ciljeva
        </h3>

        {notification && (
          <div
            className={`py-1 px-2 rounded-lg border flex items-center gap-3 animate-pulse ${
              notification.includes('Čestitamo')
                ? 'bg-emerald-800/50 border-emerald-700 text-emerald-300'
                : 'bg-red-800/50 border-red-700 text-red-300'
            }`}
          >
            <Zap size={14} />
            <span className="font-semibold text-sm">{notification}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Video size={16} className="text-red-400" /> Kratka forma
            </span>
            <span className="text-xs text-white font-bold">
              {completedShort} / {monthlyGoalShort}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getBarColor(
                completedShort,
                monthlyGoalShort
              )}`}
              style={{ width: `${Math.min(100, shortPercent)}%` }}
              title={`${shortPercent.toFixed(1)}%`}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Youtube size={16} className="text-green-400" /> Duga forma
            </span>
            <span className="text-xs text-white font-bold">
              {completedLong} / {monthlyGoalLong}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getBarColor(
                completedLong,
                monthlyGoalLong
              )}`}
              style={{ width: `${Math.min(100, longPercent)}%` }}
              title={`${longPercent.toFixed(1)}%`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
