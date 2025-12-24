'use client'

import type { Task } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface CalendarViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const now = new Date()
  const actualYear = now.getFullYear()
  const actualMonth = now.getMonth()
  const actualDate = now.getDate()

  // State for the month being viewed (starts at current month)
  const [viewYear, setViewYear] = useState(actualYear)
  const [viewMonth, setViewMonth] = useState(actualMonth)

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = () => {
    setViewYear(actualYear)
    setViewMonth(actualMonth)
  }

  // Get first day of viewed month
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  // Get last day of viewed month
  const lastDayOfMonth = new Date(viewYear, viewMonth, daysInMonth(viewYear, viewMonth))

  // Start from the beginning of the week that contains the first day of the month
  const startDate = getStartOfWeek(firstDayOfMonth)
  // End at the end of the week that contains the last day of the month
  const endDate = getStartOfWeek(lastDayOfMonth)
  endDate.setDate(endDate.getDate() + 6) // Add 6 days to get to the end of that week

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

  const isToday = (date: Date) =>
    date.getFullYear() === actualYear &&
    date.getMonth() === actualMonth &&
    date.getDate() === actualDate

  const isViewedMonth = (date: Date) =>
    date.getMonth() === viewMonth && date.getFullYear() === viewYear

  const isPast = (date: Date) => {
    const today = new Date(actualYear, actualMonth, actualDate)
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    return compareDate < today
  }

  const isCurrentMonth = viewYear === actualYear && viewMonth === actualMonth

  const monthNames = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ]

  return (
    <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-3 h-auto overflow-y-auto">
      {/* Month Header with Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
          aria-label="Prethodni mesec"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-white">
            {monthNames[viewMonth]} {viewYear}
          </h2>
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline"
            >
              Vrati se na danas
            </button>
          )}
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
          aria-label="Sledeći mesec"
        >
          <ChevronRight size={20} />
        </button>
      </div>

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
          const isOtherMonth = !isViewedMonth(day)
          const today = isToday(day)

          const dayClasses = `p-1 h-28 border rounded-lg overflow-hidden transition-all duration-100 relative ${today
              ? 'bg-blue-600/30 border-blue-500 ring-2 ring-blue-400/50'
              : isOtherMonth
                ? 'bg-slate-800/10 border-slate-800/30 opacity-40'
                : 'bg-slate-800/20 border-slate-800/50 hover:bg-slate-700/20'
            }`

          return (
            <div key={index} className={dayClasses}>
              <div
                className={`text-sm font-bold absolute top-1 right-2 ${today
                    ? 'text-blue-200 bg-blue-600/50 rounded-full w-7 h-7 flex items-center justify-center ring-2 ring-blue-400'
                    : isOtherMonth
                      ? 'text-slate-500'
                      : 'text-slate-300'
                  }`}
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
                      className={`px-2 py-1 rounded-md text-xs font-medium truncate cursor-pointer shadow-md border transition-opacity ${pastTask
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

