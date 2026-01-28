import { useState } from 'react'
import type { PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { cn } from '../../../utils/classNames'
import { CheckCircle2, Circle, Edit2, FileText, Target, HelpCircle, Layout, ChevronDown, ChevronUp } from 'lucide-react'
import { WeekEditModal } from './WeekEditModal'
import { TemplateModal } from './TemplateModal'
import { useEditModal } from '../../../hooks/useEditModal'

interface WeekCardProps {
  week: PlanWeek
  templates?: Record<string, string>
  workTypes?: Array<{ name: string; description?: string }>
  onTodoStatusChange?: (todoId: string, status: 'not_started' | 'in_progress' | 'blocked' | 'done') => void
  onEdit?: (updates: {
    name?: string
    theme?: string
    status?: PlanWeek['status']
    todos?: PlanWeek['todos']
    deliverables?: PlanWeek['deliverables']
  }) => void
  onDelete?: () => void
  className?: string
}

const STATUS_CONFIG: Record<PlanWeek['status'], { label: string, color: string, bg: string, border: string }> = {
  completed: { label: 'Done', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  current: { label: 'Current', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  not_started: { label: 'Todo', color: 'text-zinc-600', bg: 'bg-zinc-50', border: 'border-zinc-200' },
}

export function WeekCard({ week, templates, workTypes, onTodoStatusChange, onEdit, onDelete, className }: WeekCardProps) {
  const isDone = week.status === 'completed'
  const isCurrent = week.status === 'current'
  const { isOpen: isEditModalOpen, open: openEditModal, close: closeEditModal } = useEditModal()
  const { isOpen: templateModalOpen, open: openTemplateModal, close: closeTemplateModal } = useEditModal()
  const [selectedTemplate, setSelectedTemplate] = useState<{ title: string; markdown: string } | null>(null)
  const [showAllTodos, setShowAllTodos] = useState(false)

  // Calculate completion
  const totalTodos = week.todos.length
  const completedTodos = week.todos.filter(t => t.status === 'done').length
  const progress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0

  const handleTemplateClick = (todoTitle: string, templateId: string) => {
    if (templates && templates[templateId]) {
      setSelectedTemplate({
        title: todoTitle,
        markdown: templates[templateId]
      })
      openTemplateModal()
    }
  }

  const statusStyle = STATUS_CONFIG[week.status]

  return (
    <>
      <div
        className={cn(
          'group rounded-xl transition-all duration-200 ease-out',
          isCurrent 
            ? 'glass-card border-emerald-500/30 shadow-md ring-1 ring-emerald-500/20 bg-emerald-50/5' 
            : 'glass-card hover:translate-y-[-2px] hover:border-zinc-300/50',
          isDone && 'opacity-75 bg-zinc-50/50',
          className
        )}
      >
        {/* Header Section */}
        <div className="px-5 py-4 border-b border-zinc-100/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h4 className="text-base font-bold text-zinc-900 leading-snug">
                  <span className="mr-2 inline-block px-1.5 py-0.5 text-2xs font-mono font-medium bg-zinc-100 text-zinc-600 rounded align-middle relative -top-0.5">
                    Week {week.weekNumber}
                  </span>
                  {week.name}
                </h4>
                <span className={cn(
                  "px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider rounded border",
                  statusStyle.bg, statusStyle.color, statusStyle.border
                )}>
                  {statusStyle.label}
                </span>
              </div>

              {/* Date range */}
              <p className="text-xs text-zinc-500 mt-1 ml-1">
                {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              
              {week.theme && (
                <p className="text-xs text-zinc-500 italic mt-1 ml-1">
                  "{week.theme}"
                </p>
              )}
            </div>

            {onEdit && (
              <button
                onClick={() => openEditModal()}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                title="Edit week"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Goals & Reflection Grid */}
          {((week.goals && week.goals.length > 0) || (week.reflectionQuestions && week.reflectionQuestions.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Goals */}
              {week.goals && week.goals.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <Target className="w-3.5 h-3.5" />
                    <h5 className="text-2xs font-bold uppercase tracking-wider">Goals</h5>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {week.goals.map((goal, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reflection Questions */}
              {week.reflectionQuestions && week.reflectionQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-700">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <h5 className="text-2xs font-bold uppercase tracking-wider">Reflections</h5>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {week.reflectionQuestions.map((question, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs text-gray-600 italic">
                        <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Todos Section */}
          <div className="bg-gray-50/50 rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h5 className="text-2xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-3 h-3" />
                Todos
              </h5>
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-2xs font-medium text-gray-500">
                  {completedTodos}/{totalTodos}
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {week.todos.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 italic">
                  No todos planned for this week
                </div>
              ) : (
                <>
                  {(showAllTodos ? week.todos : week.todos.slice(0, 5)).map((todo) => (
                    <div 
                      key={todo.id} 
                      className={cn(
                        "group/todo px-3 py-2 flex items-start gap-2.5 transition-colors hover:bg-white",
                        todo.status === 'done' && "bg-gray-50/50"
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          if (onTodoStatusChange) {
                            const nextStatus = todo.status === 'done' ? 'not_started' : 'done'
                            onTodoStatusChange(todo.id, nextStatus)
                          }
                        }}
                        disabled={!onTodoStatusChange}
                        className={cn(
                          "mt-0.5 shrink-0 transition-all duration-200",
                          !onTodoStatusChange && "cursor-not-allowed opacity-50"
                        )}
                      >
                        {todo.status === 'done' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300 group-hover/todo:text-emerald-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className={cn(
                            "text-xs leading-snug transition-all",
                            todo.status === 'done' ? "text-gray-400 line-through decoration-gray-300" : "text-gray-700"
                          )}>
                            {todo.name || todo.title}
                          </p>
                          {todo.typeId && (
                            <span className="shrink-0 px-1 py-0.5 text-[9px] font-medium bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase tracking-wide">
                              {todo.typeId}
                            </span>
                          )}
                        </div>
                      </div>

                      {todo.templateId && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleTemplateClick(todo.name || todo.title, todo.templateId!)
                          }}
                          className="shrink-0 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all opacity-0 group-hover/todo:opacity-100"
                          title="View template"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {week.todos.length > 5 && (
                    <button
                      onClick={() => setShowAllTodos(!showAllTodos)}
                      className="w-full px-3 py-1.5 text-2xs font-medium text-gray-500 hover:text-emerald-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                    >
                      {showAllTodos ? (
                        <>Show less <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Show {week.todos.length - 5} more <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {onEdit && (
          <WeekEditModal
            week={week}
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            onSave={onEdit}
            onDelete={onDelete}
            workTypes={workTypes}
            templates={templates}
          />
        )}

        {/* Template Modal */}
        {selectedTemplate && (
          <TemplateModal
            isOpen={templateModalOpen}
            onClose={() => {
              closeTemplateModal()
              setSelectedTemplate(null)
            }}
            title={selectedTemplate.title}
            markdown={selectedTemplate.markdown}
          />
        )}
      </div>
    </>
  )
}
