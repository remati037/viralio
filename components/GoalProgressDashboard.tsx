'use client'

import { Video, Youtube, Target, Zap } from 'lucide-react'

interface GoalProgressDashboardProps {
  progress: {
    completedShort: number
    completedLong: number
    requiredShort: number
    requiredLong: number
    notification: string | null
  }
  goals: {
    monthlyGoalShort: number
    monthlyGoalLong: number
  }
}

export default function GoalProgressDashboard({ progress, goals }: GoalProgressDashboardProps) {
  const { completedShort, completedLong, notification } = progress
  const { monthlyGoalShort, monthlyGoalLong } = goals

  const shortPercent = monthlyGoalShort > 0 ? (completedShort / monthlyGoalShort) * 100 : 0
  const longPercent = monthlyGoalLong > 0 ? (completedLong / monthlyGoalLong) * 100 : 0

  const getBarColor = (current: number, goal: number) => {
    const percent = goal > 0 ? current / goal : 0
    if (percent >= 1) return 'bg-emerald-500'
    if (percent >= 0.75) return 'bg-blue-500'
    if (notification && notification.includes('ubrzati')) return 'bg-red-500'
    return 'bg-yellow-500'
  }

  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 mb-8 shadow-inner">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <Target size={20} className="text-yellow-400" /> Progres Mesečnih Ciljeva
      </h3>

      {notification && (
        <div
          className={`mb-4 p-3 rounded-lg border flex items-center gap-3 animate-pulse ${
            notification.includes('Čestitamo')
              ? 'bg-emerald-800/50 border-emerald-700 text-emerald-300'
              : 'bg-red-800/50 border-red-700 text-red-300'
          }`}
        >
          <Zap size={20} />
          <span className="font-semibold text-sm">{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Video size={16} className="text-red-400" /> Kratka Forma
            </span>
            <span className="text-xs text-white font-bold">
              {completedShort} / {monthlyGoalShort}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getBarColor(completedShort, monthlyGoalShort)}`}
              style={{ width: `${Math.min(100, shortPercent)}%` }}
              title={`${shortPercent.toFixed(1)}%`}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Youtube size={16} className="text-green-400" /> Duga Forma
            </span>
            <span className="text-xs text-white font-bold">
              {completedLong} / {monthlyGoalLong}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getBarColor(completedLong, monthlyGoalLong)}`}
              style={{ width: `${Math.min(100, longPercent)}%` }}
              title={`${longPercent.toFixed(1)}%`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

