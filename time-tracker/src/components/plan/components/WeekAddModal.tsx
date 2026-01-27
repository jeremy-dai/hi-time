import { useState } from 'react'
import type { PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { Modal } from '../../shared/Modal'
import { Plus, Trash2 } from 'lucide-react'

interface WeekAddModalProps {
  cycleId: string
  cycleName: string
  isOpen: boolean
  onClose: () => void
  onAdd: (cycleId: string, weekData: Partial<PlanWeek>, insertAfterWeekNumber?: number) => void
  insertAfterWeekNumber?: number
  insertPosition?: 'start' | 'after' | 'end'
}

export function WeekAddModal({ cycleId, cycleName, isOpen, onClose, onAdd, insertAfterWeekNumber, insertPosition = 'end' }: WeekAddModalProps) {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('')
  const [status, setStatus] = useState<PlanWeek['status']>('not_started')
  const [todos, setTodos] = useState<string[]>([])
  const [deliverables, setDeliverables] = useState<string[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [newDeliverable, setNewDeliverable] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a week name')
      return
    }

    const weekData: Partial<PlanWeek> = {
      name,
      theme: theme || undefined,
      status,
      todos: todos.map((title, index) => ({
        id: `todo-${Date.now()}-${index}`,
        title,
        name: title,
        status: 'not_started' as const,
        priority: 'medium' as const,
        estimate: 0
      })),
      deliverables: deliverables.map((title, index) => ({
        id: `deliverable-${Date.now()}-${index}`,
        title,
        name: title,
        status: 'not_started' as const
      }))
    }

    onAdd(cycleId, weekData, insertAfterWeekNumber)
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setName('')
    setTheme('')
    setStatus('not_started')
    setTodos([])
    setDeliverables([])
    setNewTodo('')
    setNewDeliverable('')
  }

  const handleCancel = () => {
    handleReset()
    onClose()
  }

  const addTodoItem = () => {
    if (newTodo.trim()) {
      setTodos([...todos, newTodo.trim()])
      setNewTodo('')
    }
  }

  const removeTodoItem = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index))
  }

  const addDeliverableItem = () => {
    if (newDeliverable.trim()) {
      setDeliverables([...deliverables, newDeliverable.trim()])
      setNewDeliverable('')
    }
  }

  const removeDeliverableItem = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index))
  }

  const getModalTitle = () => {
    if (insertPosition === 'start') {
      return `Add Week at Start of ${cycleName}`
    } else if (insertPosition === 'after' && insertAfterWeekNumber) {
      return `Add Week After Week ${insertAfterWeekNumber} in ${cycleName}`
    } else {
      return `Add Week to ${cycleName}`
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={getModalTitle()}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Foundation & Setup"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Week theme (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PlanWeek['status'])}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Todos ({todos.length})
          </label>
          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto mb-2">
            {todos.map((todo, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <input
                  type="text"
                  value={todo}
                  onChange={(e) => {
                    const newTodos = [...todos]
                    newTodos[index] = e.target.value
                    setTodos(newTodos)
                  }}
                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={() => removeTodoItem(index)}
                  className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTodoItem()
              }}
              placeholder="Add todo..."
              className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={addTodoItem}
              disabled={!newTodo.trim()}
              className="p-1 text-emerald-600 hover:text-emerald-700 disabled:text-gray-300"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Deliverables */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deliverables ({deliverables.length})
          </label>
          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto mb-2">
            {deliverables.map((deliverable, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <input
                  type="text"
                  value={deliverable}
                  onChange={(e) => {
                    const newDeliverables = [...deliverables]
                    newDeliverables[index] = e.target.value
                    setDeliverables(newDeliverables)
                  }}
                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={() => removeDeliverableItem(index)}
                  className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newDeliverable}
              onChange={(e) => setNewDeliverable(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addDeliverableItem()
              }}
              placeholder="Add deliverable..."
              className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={addDeliverableItem}
              disabled={!newDeliverable.trim()}
              className="p-1 text-emerald-600 hover:text-emerald-700 disabled:text-gray-300"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Add Week
          </button>
        </div>
      </div>
    </Modal>
  )
}
