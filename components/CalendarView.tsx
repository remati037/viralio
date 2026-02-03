'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task } from '@/types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

/** Format a Date as ISO string at noon UTC so the calendar day is preserved across timezones. */
function toPublishDateISO(day: Date): string {
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, '0');
  const d = String(day.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T12:00:00.000Z`;
}

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  /** When provided, task chips become draggable and day cells accept drops to update publish_date. */
  onUpdatePublishDate?: (
    taskId: string,
    publishDate: string
  ) => void | Promise<void>;
}

export default function CalendarView({
  tasks,
  onTaskClick,
  onUpdatePublishDate,
}: CalendarViewProps) {
  const now = new Date();
  const actualYear = now.getFullYear();
  const actualMonth = now.getMonth();
  const actualDate = now.getDate();

  const [viewYear, setViewYear] = useState(actualYear);
  const [viewMonth, setViewMonth] = useState(actualMonth);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetDay, setDropTargetDay] = useState<Date | null>(null);

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

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(
    viewYear,
    viewMonth,
    daysInMonth(viewYear, viewMonth)
  );

  const startDate = getStartOfWeek(firstDayOfMonth);
  const endDate = getStartOfWeek(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + 6);

  const days: Date[] = [];
  let currentDay = new Date(startDate);

  while (currentDay <= endDate) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  // Only tasks with a publish_date are shown in the calendar
  const tasksByDate = tasks
    .filter((t) => t.publish_date)
    .reduce(
      (acc, task) => {
        const date = new Date(task.publish_date!).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(task);
        return acc;
      },
      {} as Record<string, Task[]>
    );

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
    <>
      <Card className="h-auto overflow-y-auto border-border bg-card p-3 md:p-4">
        {/* Month Header with Navigation */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="shrink-0 rounded-lg"
            aria-label="Prethodni mesec"
          >
            <ChevronLeft size={20} />
          </Button>

          <div className="flex flex-1 flex-col items-center gap-0.5">
            <h2 className="text-xl font-bold text-foreground md:text-2xl">
              {monthNames[viewMonth]} {viewYear}
            </h2>
            {!isCurrentMonth && (
              <Button
                variant="link"
                size="sm"
                onClick={goToToday}
                className="h-auto text-xs text-primary underline-offset-2"
              >
                Vrati se na danas
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="shrink-0 rounded-lg"
            aria-label="Sledeći mesec"
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="mb-2 grid grid-cols-7 gap-px text-center text-xs font-bold text-muted-foreground">
          {['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED'].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
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
                  onTaskClick(dayTasks[0]);
                } else {
                  setSelectedDayTasks(dayTasks);
                  setSelectedDate(day);
                }
              }
            };

            const handleTaskClick = (e: React.MouseEvent, task: Task) => {
              e.stopPropagation();
              onTaskClick(task);
            };

            const isDropTarget =
              onUpdatePublishDate &&
              dropTargetDay &&
              day.toDateString() === dropTargetDay.toDateString();

            const handleDayDragOver = (e: React.DragEvent) => {
              if (!onUpdatePublishDate) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDropTargetDay(day);
            };

            const handleDayDrop = (e: React.DragEvent) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('taskId');
              if (taskId && onUpdatePublishDate) {
                onUpdatePublishDate(taskId, toPublishDateISO(day));
              }
              setDropTargetDay(null);
            };

            const dayClasses = `relative min-h-20 rounded-lg border p-1 transition-all duration-100 md:min-h-28 ${
              today
                ? 'border-primary bg-primary/15 ring-2 ring-primary/30'
                : isOtherMonth
                  ? 'border-border/50 bg-muted/20 opacity-40'
                  : 'border-border bg-muted/30 hover:bg-muted/50'
            } ${hasTasks && !isOtherMonth ? 'cursor-pointer md:cursor-default' : ''} ${
              isDropTarget ? 'ring-2 ring-primary bg-primary/10' : ''
            }`;

            return (
              <div
                key={index}
                className={dayClasses}
                onClick={handleDayClick}
                onDragOver={handleDayDragOver}
                onDrop={handleDayDrop}
              >
                <div
                  className={`absolute right-2 top-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                    today
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                      : isOtherMonth
                        ? 'text-muted-foreground'
                        : 'text-foreground'
                  }`}
                >
                  {day.getDate()}
                </div>

                {/* Mobile: Task indicator */}
                {hasTasks && !isOtherMonth && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 md:hidden">
                    <div
                      className={`flex cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110 ${
                        isPast(day)
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-chart-1 text-primary-foreground shadow-md'
                      } ${dayTasks.length > 1 ? 'h-6 min-w-6 px-2 text-xs font-bold' : 'h-3 w-3'}`}
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

                {/* Desktop: Task previews (draggable when onUpdatePublishDate is provided) */}
                {hasTasks && !isOtherMonth && (
                  <div className="task-preview-container mt-6 hidden space-y-1 px-1 md:block">
                    {dayTasks.map((task) => {
                      const pastTask = isPast(day);
                      const isDragging = draggedTaskId === task.id;
                      return (
                        <div
                          key={task.id}
                          draggable={!!onUpdatePublishDate}
                          onClick={(e) => handleTaskClick(e, task)}
                          onDragStart={(e) => {
                            if (!onUpdatePublishDate) return;
                            e.dataTransfer.setData('taskId', task.id);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', task.title);
                            setDraggedTaskId(task.id);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDropTargetDay(null);
                          }}
                          className={`task-preview truncate rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition-opacity ${
                            onUpdatePublishDate
                              ? 'cursor-grab active:cursor-grabbing'
                              : 'cursor-pointer'
                          } ${isDragging ? 'opacity-50' : ''} ${
                            pastTask
                              ? 'border-border bg-muted text-muted-foreground'
                              : 'border-chart-1/50 bg-chart-1/80 text-primary-foreground hover:bg-chart-1'
                          }`}
                          title={task.title}
                        >
                          {task.format === 'Kratka Forma' ? '🎥' : '📺'}{' '}
                          {task.title}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day tasks modal */}
      {selectedDayTasks && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
          <Card className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden border-border shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border p-4 md:p-6">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-foreground md:text-xl">
                  {formatDateDisplay(selectedDate)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDayTasks.length}{' '}
                  {selectedDayTasks.length === 1 ? 'zadatak' : 'zadataka'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedDayTasks(null);
                  setSelectedDate(null);
                }}
                className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Zatvori"
              >
                <X size={20} />
              </Button>
            </CardHeader>

            <CardContent className="overflow-y-auto p-4">
              <div className="space-y-2">
                {selectedDayTasks.map((task) => {
                  const taskDate = task.publish_date
                    ? new Date(task.publish_date)
                    : null;
                  const isPastTask = taskDate ? isPast(taskDate) : false;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleTaskSelectFromModal(task)}
                      className={`w-full rounded-lg border p-4 text-left transition-all hover:opacity-90 ${
                        isPastTask
                          ? 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
                          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-lg">
                              {task.format === 'Kratka Forma' ? '🎥' : '📺'}
                            </span>
                            {task.category && (
                              <Badge
                                variant="outline"
                                className="border-border text-xs font-semibold"
                                style={{
                                  color: task.category.color,
                                  borderColor: `${task.category.color}60`,
                                  backgroundColor: `${task.category.color}15`,
                                }}
                              >
                                {task.category.name}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                task.format === 'Kratka Forma'
                                  ? 'border-destructive/50 bg-destructive/20 text-destructive'
                                  : 'border-chart-2/50 bg-chart-2/20 text-chart-2'
                              }`}
                            >
                              {task.format}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-bold leading-snug text-foreground">
                            {task.title}
                          </h4>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
