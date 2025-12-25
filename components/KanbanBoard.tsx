'use client'

import { useState } from 'react'
import { Plus, Move, ChevronRight, Trash2 } from 'lucide-react'
import { KANBAN_COLUMNS } from '@/lib/constants'
import type { Task } from '@/types'

interface KanbanBoardProps {
  tasks: Task[]
  onMoveTask: (taskId: string, newStatus: string) => void
  onDeleteTask: (taskId: string) => void
  onTaskClick: (task: Task) => void
  onTaskDrop: (taskId: string, columnId: string) => void
  onNewIdea: () => void
}

export default function KanbanBoard({
  tasks,
  onMoveTask,
  onDeleteTask,
  onTaskClick,
  onTaskDrop,
  onNewIdea,
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) {
      onTaskDrop(taskId, columnId)
    }
    setDraggedTaskId(null)
  }

  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-[1000px] h-full">
        {KANBAN_COLUMNS.map((column, colIndex) => {
          const columnTasks = tasks.filter((t) => t.status === column.id)
          return (
            <div
              key={column.id}
              className="w-80 flex flex-col h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div
                className={`flex items-center gap-2 p-3 rounded-t-xl border-t border-x border-slate-700/50 ${column.color} bg-opacity-10`}
              >
                <span className="font-bold text-sm">{column.title}</span>
                <span className="ml-auto bg-slate-900/50 px-2 py-0.5 rounded text-xs opacity-70">{columnTasks.length}</span>
              </div>

              <div
                className={`flex-1 bg-slate-900/30 border-x border-b border-slate-800 rounded-b-xl p-3 space-y-3 overflow-y-auto min-h-[500px] transition-colors ${
                  draggedTaskId ? 'bg-slate-900/50 border-dashed border-slate-700' : ''
                }`}
              >
                {column.id === 'idea' && (
                  <button
                    onClick={onNewIdea}
                    className="w-full py-2 rounded-lg border-2 border-dashed border-slate-700 text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-colors flex items-center justify-center gap-2 mb-3"
                  >
                    <Plus size={16} /> Dodaj Novu Ideju
                  </button>
                )}

                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onTaskClick(task)}
                    className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all cursor-pointer group relative active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start mb-2">
                      {task.category && (
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold bg-slate-900 px-2 py-1 rounded pointer-events-none"
                          style={{
                            color: task.category.color,
                            border: `1px solid ${task.category.color}40`,
                          }}
                        >
                          {task.category.name}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        {!task.is_admin_case_study && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Da li ste sigurni da želite da obrišete zadatak "${task.title}"?`)) {
                                onDeleteTask(task.id)
                              }
                            }}
                            className="p-1 rounded hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Obriši zadatak"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <Move size={14} className="text-slate-600 opacity-50 pointer-events-none" />
                      </div>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-3 leading-snug pointer-events-none">{task.title}</h4>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full font-bold pointer-events-none ${
                          task.format === 'Kratka Forma' ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'
                        }`}
                      >
                        {task.format}
                      </span>

                      <span className="text-xs text-slate-500 font-mono pointer-events-none">
                        {task.publish_date
                          ? new Date(task.publish_date).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })
                          : new Date(task.created_at).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })}
                      </span>

                      <button
                        disabled={colIndex === KANBAN_COLUMNS.length - 1}
                        onClick={(e) => {
                          e.stopPropagation()
                          onMoveTask(task.id, KANBAN_COLUMNS[colIndex + 1].id)
                        }}
                        className={`p-1.5 rounded hover:bg-slate-700 text-slate-400 ${
                          colIndex === KANBAN_COLUMNS.length - 1 ? 'opacity-0 cursor-default' : ''
                        }`}
                        title="Pomeri desno"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && column.id !== 'idea' && (
                  <div className="text-center py-10 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-lg pointer-events-none">
                    Prevuci ovde
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

