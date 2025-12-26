'use client';

import type { Task } from '@/types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function CalendarView({
  tasks,
  onTaskClick,
}: CalendarViewProps) {
  const now = new Date();
  const actualYear = now.getFullYear();
  const actualMonth = now.getMonth();
  const actualDate = now.getDate();

  // State for the month being viewed (starts at current month)
  const [viewYear, setViewYear] = useState(actualYear);
  const [viewMonth, setViewMonth] = useState(actualMonth);
  // State for tasks modal
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setViewYear(actualYear);
    setViewMonth(actualMonth);
  };

  // Get first day of viewed month
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // Get last day of viewed month
  const lastDayOfMonth = new Date(
    viewYear,
    viewMonth,
    daysInMonth(viewYear, viewMonth)
  );

  // Start from the beginning of the week that contains the first day of the month
  const startDate = getStartOfWeek(firstDayOfMonth);
  // End at the end of the week that contains the last day of the month
  const endDate = getStartOfWeek(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + 6); // Add 6 days to get to the end of that week

  const days: Date[] = [];
  let currentDay = new Date(startDate);

  while (currentDay <= endDate) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const tasksByDate = tasks
    .filter((t) => t.publish_date)
    .reduce((acc, task) => {
      const date = new Date(task.publish_date!).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

  const isToday = (date: Date) =>
    date.getFullYear() === actualYear &&
    date.getMonth() === actualMonth &&
    date.getDate() === actualDate;

  const isViewedMonth = (date: Date) =>
    date.getMonth() === viewMonth && date.getFullYear() === viewYear;

  const isPast = (date: Date) => {
    const today = new Date(actualYear, actualMonth, actualDate);
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isCurrentMonth = viewYear === actualYear && viewMonth === actualMonth;

  const monthNames = [
    'Januar',
    'Februar',
    'Mart',
    'April',
    'Maj',
    'Jun',
    'Jul',
    'Avgust',
    'Septembar',
    'Oktobar',
    'Novembar',
    'Decembar',
  ];

  const formatDateDisplay = (date: Date): string => {
    return `${date.getDate()}. ${
      monthNames[date.getMonth()]
    } ${date.getFullYear()}`;
  };

  const handleTaskSelectFromModal = (task: Task) => {
    setSelectedDayTasks(null);
    setSelectedDate(null);
    onTaskClick(task);
  };

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
          const dateString = day.toDateString();
          const dayTasks = tasksByDate[dateString] || [];
          const isOtherMonth = !isViewedMonth(day);
          const today = isToday(day);
          const hasTasks = dayTasks.length > 0;

          const handleDayClick = () => {
            if (hasTasks) {
              if (dayTasks.length === 1) {
                // Single task - open directly
                onTaskClick(dayTasks[0]);
              } else {
                // Multiple tasks - show modal
                setSelectedDayTasks(dayTasks);
                setSelectedDate(day);
              }
            }
          };

          const handleTaskClick = (e: React.MouseEvent, task: Task) => {
            e.stopPropagation(); // Prevent day click from firing
            onTaskClick(task);
          };

          const dayClasses = `p-1 h-20 md:h-28 border rounded-lg overflow-hidden transition-all duration-100 relative ${
            today
              ? 'bg-blue-600/30 border-blue-500 ring-2 ring-blue-400/50'
              : isOtherMonth
              ? 'bg-slate-800/10 border-slate-800/30 opacity-40'
              : 'bg-slate-800/20 border-slate-800/50 hover:bg-slate-700/20'
          } ${hasTasks && !isOtherMonth ? 'cursor-pointer' : ''}`;

          return (
            <div key={index} className={dayClasses} onClick={handleDayClick}>
              <div
                className={`text-sm font-bold absolute top-1 right-2 ${
                  today
                    ? 'text-blue-200 bg-blue-600/50 rounded-full w-7 h-7 flex items-center justify-center ring-2 ring-blue-400'
                    : isOtherMonth
                    ? 'text-slate-500'
                    : 'text-slate-300'
                }`}
              >
                {day.getDate()}
              </div>

              {/* Task indicator - show dot/badge if there are tasks */}
              {hasTasks && !isOtherMonth && (
                <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-110 ${
                      isPast(day)
                        ? 'bg-slate-600/70 text-slate-300'
                        : 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                    } ${
                      dayTasks.length > 1
                        ? 'w-6 h-6 text-xs font-bold px-2'
                        : 'w-3 h-3'
                    }`}
                    title={
                      dayTasks.length === 1
                        ? dayTasks[0].title
                        : `${dayTasks.length} zadataka`
                    }
                  >
                    {dayTasks.length > 1 ? dayTasks.length : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tasks Modal */}
      {selectedDayTasks && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {formatDateDisplay(selectedDate)}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedDayTasks.length}{' '}
                  {selectedDayTasks.length === 1 ? 'zadatak' : 'zadataka'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedDayTasks(null);
                  setSelectedDate(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-2">
              {selectedDayTasks.map((task) => {
                const taskDate = task.publish_date
                  ? new Date(task.publish_date)
                  : null;
                const isPastTask = taskDate ? isPast(taskDate) : false;

                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskSelectFromModal(task)}
                    className={`w-full text-left p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                      isPastTask
                        ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        : 'bg-slate-800 border-slate-700 text-white hover:bg-blue-600/20 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">
                            {task.format === 'Kratka Forma' ? '🎥' : '📺'}
                          </span>
                          {task.category && (
                            <span
                              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                              style={{
                                color: task.category.color,
                                borderColor: `${task.category.color}40`,
                                backgroundColor: `${task.category.color}15`,
                              }}
                            >
                              {task.category.name}
                            </span>
                          )}
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              task.format === 'Kratka Forma'
                                ? 'bg-red-900/30 text-red-300 border-red-700/50'
                                : 'bg-green-900/30 text-green-300 border-green-700/50'
                            }`}
                          >
                            {task.format}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm leading-snug">
                          {task.title}
                        </h4>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
