import { useState, useEffect } from 'react'
import type { PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { Modal } from '../../shared/Modal'
import { CheckCircle2, Circle, Plus, Trash2, FileText } from 'lucide-react'
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
}

export function WeekEditModal({ week, isOpen, onClose, onSave, onDelete }: WeekEditModalProps) {
  const [editName, setEditName] = useState(week.name)
  const [editTheme, setEditTheme] = useState(week.theme || '')
  const [editStatus, setEditStatus] = useState(week.status)
  const [editTodos, setEditTodos] = useState(week.todos)
  const [editDeliverables, setEditDeliverables] = useState(week.deliverables)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('')
  const [viewingDeliverable, setViewingDeliverable] = useState<{ name: string; content: string } | null>(null)

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

  const updateTodo = (id: string, title: string) => {
    setEditTodos(editTodos.map(t =>
      t.id === id ? { ...t, title, name: title } : t
    ))
  }

  const toggleTodoStatus = (id: string) => {
    setEditTodos(editTodos.map(t =>
      t.id === id ? { ...t, status: t.status === 'done' ? 'not_started' : 'done' } : t
    ))
  }

  const deleteTodo = (id: string) => {
    setEditTodos(editTodos.filter(t => t.id !== id))
  }

  const addDeliverable = () => {
    if (!newDeliverableTitle.trim()) return
    const newDeliverable = {
      id: `deliverable-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: newDeliverableTitle,
      name: newDeliverableTitle,
      status: 'not_started' as const
    }
    setEditDeliverables([...editDeliverables, newDeliverable])
    setNewDeliverableTitle('')
  }

  const updateDeliverable = (id: string, title: string) => {
    setEditDeliverables(editDeliverables.map(d =>
      d.id === id ? { ...d, title, name: title } : d
    ))
  }

  const deleteDeliverable = (id: string) => {
    setEditDeliverables(editDeliverables.filter(d => d.id !== id))
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {editTodos.map((todo) => (
              <div key={todo.id} className="flex items-start gap-2 group">
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
                  onChange={(e) => updateTodo(todo.id, e.target.value)}
                  className={cn(
                    "flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500",
                    todo.status === 'done' && 'line-through text-gray-400'
                  )}
                />
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-gray-300 shrink-0" />
              <input
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTodo()
                }}
                placeholder="Add new todo..."
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={addTodo}
                disabled={!newTodoTitle.trim()}
                className="p-1 text-emerald-600 hover:text-emerald-700 disabled:text-gray-300"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Deliverables ({editDeliverables.filter(d => d.status === 'done').length}/{editDeliverables.length})
            </label>
          </div>
          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {editDeliverables.map((del) => (
              <div key={del.id} className="flex items-center gap-2 group">
                <input
                  type="text"
                  value={del.name || del.title}
                  onChange={(e) => updateDeliverable(del.id, e.target.value)}
                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {del.description && (
                  <button
                    onClick={() => setViewingDeliverable({
                      name: del.name || del.title,
                      content: del.description || ''
                    })}
                    className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                    title="View deliverable details"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteDeliverable(del.id)}
                  className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDeliverableTitle}
                onChange={(e) => setNewDeliverableTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addDeliverable()
                }}
                placeholder="Add new deliverable..."
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={addDeliverable}
                disabled={!newDeliverableTitle.trim()}
                className="p-1 text-emerald-600 hover:text-emerald-700 disabled:text-gray-300"
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

    {/* Deliverable Markdown Viewer Modal */}
    {viewingDeliverable && (
      <Modal
        isOpen={true}
        onClose={() => setViewingDeliverable(null)}
        title={viewingDeliverable.name}
        size="large"
      >
        <div className="bg-gray-50 rounded-xl p-6 max-h-[60vh] overflow-y-auto">
          <MarkdownRenderer content={viewingDeliverable.content} />
        </div>
      </Modal>
    )}
  </>
  )
}
