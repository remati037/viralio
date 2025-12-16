'use client'

import type { Task } from '@/types'

interface CalendarViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const now = new Date()
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const startDate = getStartOfWeek(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, daysInMonth(now.getFullYear(), now.getMonth() + 2))

  const days: Date[] = []
  let currentDay = new Date(startDate)

  while (currentDay <= endDate) {
    days.push(new Date(currentDay))
    currentDay.setDate(currentDay.getDate() + 1)
  }

  const tasksByDate = tasks
    .filter((t) => t.publish_date)
    .reduce((acc, task) => {
      const date = new Date(task.publish_date!).toDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(task)
      return acc
    }, {} as Record<string, Task[]>)

  const isToday = (date: Date) => date.toDateString() === now.toDateString()
  const isPast = (date: Date) => date < new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return (
    <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-3 h-full overflow-y-auto">
      <div className="grid grid-cols-7 gap-px text-center text-xs font-bold text-slate-400 mb-2">
        {['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED'].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {days.map((day, index) => {
          const dateString = day.toDateString()
          const dayTasks = tasksByDate[dateString] || []
          const isOtherMonth =
            day.getMonth() !== now.getMonth() &&
            (day < now || day > new Date(now.getFullYear(), now.getMonth() + 1, 0))

          const dayClasses = `p-1 h-28 border border-slate-800/50 rounded-lg overflow-hidden transition-all duration-100 relative ${
            isToday(day) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800/20 hover:bg-slate-700/20'
          } ${isOtherMonth ? 'opacity-40' : ''}`

          return (
            <div key={index} className={dayClasses}>
              <div
                className={`text-sm font-bold absolute top-1 right-2 ${isToday(day) ? 'text-blue-300' : 'text-slate-300'}`}
              >
                {day.getDate()}
              </div>

              <div className="space-y-1 mt-6 px-1">
                {dayTasks.map((task) => {
                  const pastTask = isPast(day)
                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`px-2 py-1 rounded-md text-xs font-medium truncate cursor-pointer shadow-md border transition-opacity ${
                        pastTask
                          ? 'bg-slate-700 text-slate-400 opacity-50 border-slate-600'
                          : 'bg-blue-600/80 text-white hover:bg-blue-500 border-blue-700'
                      }`}
                      title={task.title}
                    >
                      {task.format === 'Kratka Forma' ? '🎥' : '📺'} {task.title}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

