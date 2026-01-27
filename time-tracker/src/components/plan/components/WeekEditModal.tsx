import { useState, useEffect } from 'react'
import type { PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { Modal } from '../../shared/Modal'
import { CheckCircle2, Circle, Plus, Trash2, FileText, ChevronDown } from 'lucide-react'
import { cn } from '../../../utils/classNames'
import { MarkdownRenderer } from '../../shared/MarkdownRenderer'

interface WeekEditModalProps {
  week: PlanWeek
  isOpen: boolean
  onClose: () => void
  onSave: (updates: {
    name?: string
    theme?: string
    status?: PlanWeek['status']
    todos?: PlanWeek['todos']
    deliverables?: PlanWeek['deliverables']
  }) => void
  onDelete?: () => void
  workTypes?: Array<{ name: string; description?: string }>
  templates?: Record<string, string>
}

export function WeekEditModal({ week, isOpen, onClose, onSave, onDelete, workTypes, templates }: WeekEditModalProps) {
  const [editName, setEditName] = useState(week.name)
  const [editTheme, setEditTheme] = useState(week.theme || '')
  const [editStatus, setEditStatus] = useState(week.status)
  const [editTodos, setEditTodos] = useState(week.todos)
  const [editDeliverables, setEditDeliverables] = useState(week.deliverables)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<{ title: string; content: string } | null>(null)

  // Reset form when week changes
  useEffect(() => {
    setEditName(week.name)
    setEditTheme(week.theme || '')
    setEditStatus(week.status)
    setEditTodos(week.todos)
    setEditDeliverables(week.deliverables)
  }, [week])

  const handleSave = () => {
    onSave({
      name: editName,
      theme: editTheme || undefined,
      status: editStatus,
      todos: editTodos,
      deliverables: editDeliverables
    })
    onClose()
  }

  const handleCancel = () => {
    // Reset to original values
    setEditName(week.name)
    setEditTheme(week.theme || '')
    setEditStatus(week.status)
    setEditTodos(week.todos)
    setEditDeliverables(week.deliverables)
    onClose()
  }

  const addTodo = () => {
    if (!newTodoTitle.trim()) return
    const newTodo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: newTodoTitle,
      name: newTodoTitle,
      status: 'not_started' as const,
      priority: 'medium' as const,
      estimate: 0
    }
    setEditTodos([...editTodos, newTodo])
    setNewTodoTitle('')
  }

  const updateTodo = (id: string, updates: Partial<{ title: string; typeId: string; priority: 'low' | 'medium' | 'high'; templateId: string }>) => {
    setEditTodos(editTodos.map(t => {
      if (t.id === id) {
        const updated = { ...t }
        if (updates.title !== undefined) {
          updated.title = updates.title
          updated.name = updates.title
        }
        if (updates.typeId !== undefined) updated.typeId = updates.typeId
        if (updates.priority !== undefined) updated.priority = updates.priority
        if (updates.templateId !== undefined) updated.templateId = updates.templateId
        return updated
      }
      return t
    }))
  }

  const toggleTodoStatus = (id: string) => {
    setEditTodos(editTodos.map(t =>
      t.id === id ? { ...t, status: t.status === 'done' ? 'not_started' : 'done' } : t
    ))
  }

  const deleteTodo = (id: string) => {
    setEditTodos(editTodos.filter(t => t.id !== id))
  }

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Edit Week ${week.weekNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="Week name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <input
              type="text"
              value={editTheme}
              onChange={(e) => setEditTheme(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="Week theme (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as PlanWeek['status'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="not_started">Not Started</option>
              <option value="current">Current</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Todos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Todos ({editTodos.filter(t => t.status === 'done').length}/{editTodos.length})
            </label>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {editTodos.map((todo) => (
              <div key={todo.id} className="border border-gray-200 rounded-lg overflow-hidden group hover:border-gray-300 transition-colors">
                {/* Main row */}
                <div className="flex items-start gap-2 p-2 bg-white">
                  <button
                    onClick={() => toggleTodoStatus(todo.id)}
                    className="mt-0.5 shrink-0"
                  >
                    {todo.status === 'done' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400 hover:text-emerald-600" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={todo.name || todo.title}
                    onChange={(e) => updateTodo(todo.id, { title: e.target.value })}
                    className={cn(
                      "flex-1 border-0 bg-transparent px-0 py-0 text-sm focus:outline-none focus:ring-0",
                      todo.status === 'done' && 'line-through text-gray-400'
                    )}
                    placeholder="Todo title..."
                  />
                  <button
                    onClick={() => setExpandedTodoId(expandedTodoId === todo.id ? null : todo.id)}
                    className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                    title="Edit metadata"
                  >
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      expandedTodoId === todo.id && "rotate-180"
                    )} />
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Expanded metadata section */}
                {expandedTodoId === todo.id && (
                  <div className="px-2 pb-2 pt-1 bg-gray-50 border-t border-gray-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Work Type */}
                      <div>
                        <label className="block text-[10px] font-medium text-gray-600 mb-1 uppercase tracking-wide">
                          Work Type
                        </label>
                        <select
                          value={todo.typeId || ''}
                          onChange={(e) => updateTodo(todo.id, { typeId: e.target.value || undefined })}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">None</option>
                          {workTypes?.map((wt) => (
                            <option key={wt.name} value={wt.name}>
                              {wt.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-[10px] font-medium text-gray-600 mb-1 uppercase tracking-wide">
                          Priority
                        </label>
                        <select
                          value={todo.priority || 'medium'}
                          onChange={(e) => updateTodo(todo.id, { priority: e.target.value as 'low' | 'medium' | 'high' })}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    {/* Template */}
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600 mb-1 uppercase tracking-wide">
                        Template
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={todo.templateId || ''}
                          onChange={(e) => updateTodo(todo.id, { templateId: e.target.value || undefined })}
                          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">None</option>
                          {templates && Object.keys(templates).map((key) => (
                            <option key={key} value={key}>
                              {key}
                            </option>
                          ))}
                        </select>
                        {todo.templateId && templates?.[todo.templateId] && (
                          <button
                            onClick={() => setViewingTemplate({
                              title: todo.name || todo.title,
                              content: templates[todo.templateId!]
                            })}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View template"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add new todo */}
            <div className="flex items-center gap-2 p-2 border border-dashed border-gray-300 rounded-lg hover:border-emerald-400 transition-colors">
              <Circle className="h-4 w-4 text-gray-300 shrink-0" />
              <input
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTodo()
                }}
                placeholder="Add new todo..."
                className="flex-1 border-0 bg-transparent px-0 py-0 text-sm focus:outline-none focus:ring-0 placeholder:text-gray-400"
              />
              <button
                onClick={addTodo}
                disabled={!newTodoTitle.trim()}
                className="p-1 text-emerald-600 hover:text-emerald-700 disabled:text-gray-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <div>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this week? This cannot be undone.')) {
                    onDelete()
                    onClose()
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete Week
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Modal>

    {/* Template Viewer Modal */}
    {viewingTemplate && (
      <Modal
        isOpen={true}
        onClose={() => setViewingTemplate(null)}
        title={viewingTemplate.title}
        maxWidth="xl"
      >
        <div className="bg-gray-50 rounded-xl p-6 max-h-[60vh] overflow-y-auto">
          <MarkdownRenderer content={viewingTemplate.content} />
        </div>
      </Modal>
    )}
  </>
  )
}
