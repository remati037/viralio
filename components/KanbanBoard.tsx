'use client';

import { KANBAN_COLUMNS } from '@/lib/constants';
import type { Task } from '@/types';
import { ChevronRight, Move, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

interface KanbanBoardProps {
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: string) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, columnId: string) => void;
  onNewIdea: () => void;
}

export default function KanbanBoard({
  tasks,
  onMoveTask,
  onDeleteTask,
  onTaskClick,
  onTaskDrop,
  onNewIdea,
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onTaskDrop(taskId, columnId);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="h-full min-w-0 overflow-x-auto pb-4">
      <div className="flex gap-2 min-w-0 w-full h-full">
        {KANBAN_COLUMNS.map((column, colIndex) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          return (
            <Card
              key={column.id}
              className="min-w-[260px] sm:min-w-72 md:min-w-80 max-w-[calc(100vw-2rem)] flex flex-col flex-1 shrink-0 h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div
                className={`flex items-center justify-between gap-2 p-2 md:p-3 rounded-t-lg ${column.color} bg-muted`}
              >
                <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                  {column.icon && (
                    <column.icon
                      className={`${column.iconColor} shrink-0`}
                      size={16}
                    />
                  )}
                  <span className="font-bold text-sm md:text-base truncate">
                    {column.title}
                  </span>
                </div>
                <Badge
                  className="px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg text-xs border bg-background shrink-0"
                  variant="outline"
                >
                  {columnTasks.length}
                </Badge>
              </div>

              <div
                className={`flex-1 rounded-b-lg p-2 md:p-3 space-y-2 md:space-y-3 overflow-y-auto min-h-[280px] sm:min-h-[400px] md:min-h-[500px] transition-colors ${
                  draggedTaskId
                    ? 'bg-muted/50 border-2 border-dashed border-border'
                    : ''
                }`}
              >
                {column.id === 'idea' && (
                  <button
                    onClick={onNewIdea}
                    className="w-full py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-chart-1 hover:border-chart-1 transition-colors flex items-center justify-center gap-2 mb-2"
                  >
                    <Plus size={14} /> Dodaj novu skriptu
                  </button>
                )}

                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onTaskClick(task)}
                    className="bg-gradient-to-b from-background to-muted p-2 rounded-lg border border-border shadow-sm hover:border-chart-1/50 hover:shadow-lg hover:shadow-chart-1/10 transition-all cursor-pointer group relative active:cursor-grabbing"
                  >
                    <div
                      className={`flex ${
                        task.category ? 'justify-between' : 'justify-end'
                      } items-start mb-2`}
                    >
                      {task.category && (
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold bg-muted px-2 py-0.5 md:py-1 rounded pointer-events-none"
                          style={{
                            color: task.category.color,
                            border: `1px solid ${task.category.color}40`,
                          }}
                        >
                          {task.category.name}
                        </span>
                      )}
                      <div className="items-center gap-1 hidden md:flex">
                        {!task.is_admin_case_study && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  `Da li ste sigurni da želite da obrišete zadatak "${task.title}"?`
                                )
                              ) {
                                onDeleteTask(task.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            title="Obriši zadatak"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <Move
                          size={14}
                          className="text-muted-foreground opacity-50 pointer-events-none"
                        />
                      </div>
                    </div>
                    <h4 className="font-bold text-card-foreground text-lg mb-3 leading-snug pointer-events-none">
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex flex-col md:flex-row items-start gap-2 md:items-center md:gap-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-sm font-bold pointer-events-none ${
                            task.format === 'Kratka Forma'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-chart-2/20 text-chart-2'
                          }`}
                        >
                          {task.format}
                        </span>

                        {task.publish_date && (
                          <span className="text-xs text-muted-foreground pointer-events-none">
                            Planirano za:{' '}
                            {new Date(task.publish_date).toLocaleDateString(
                              'sr-RS',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        )}
                      </div>
                      <button
                        disabled={colIndex === KANBAN_COLUMNS.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveTask(task.id, KANBAN_COLUMNS[colIndex + 1].id);
                        }}
                        className={`p-1.5 rounded hover:bg-muted text-muted-foreground ${
                          colIndex === KANBAN_COLUMNS.length - 1
                            ? 'hidden cursor-default'
                            : ''
                        }`}
                        title="Pomeri desno"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </Card>
                ))}

                {columnTasks.length === 0 && column.id !== 'idea' && (
                  <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg pointer-events-none">
                    Prevuci ovde
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
