import { useState, useEffect } from 'react'
import type { PlanCycle } from '../../../hooks/useQuarterlyPlan'
import { Modal } from '../../shared/Modal'

interface CycleEditModalProps {
  cycle: PlanCycle
  cycleIndex?: number
  isOpen: boolean
  onClose: () => void
  onSave: (updates: {
    name?: string
    theme?: string
    description?: string
  }) => void
}

export function CycleEditModal({ cycle, cycleIndex, isOpen, onClose, onSave }: CycleEditModalProps) {
  const [editName, setEditName] = useState(cycle.name)
  const [editTheme, setEditTheme] = useState(cycle.theme || '')
  const [editDescription, setEditDescription] = useState(cycle.description || '')

  // Reset form when cycle changes
  useEffect(() => {
    setEditName(cycle.name)
    setEditTheme(cycle.theme || '')
    setEditDescription(cycle.description || '')
  }, [cycle])

  const handleSave = () => {
    onSave({
      name: editName,
      theme: editTheme || undefined,
      description: editDescription || undefined
    })
    onClose()
  }

  const handleCancel = () => {
    // Reset to original values
    setEditName(cycle.name)
    setEditTheme(cycle.theme || '')
    setEditDescription(cycle.description || '')
    onClose()
  }

  const getCycleNumber = () => {
    if (cycleIndex !== undefined) return cycleIndex
    const match = cycle.id.match(/\d+/)
    return match ? parseInt(match[0]) : 1
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Edit Cycle ${getCycleNumber()}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cycle Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Cycle name"
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
              placeholder="Cycle theme (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Cycle description (optional)"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <strong>Week Range:</strong> Week {cycle.startWeek} - {cycle.endWeek}
          </div>

          {cycle.coreCompetencies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Core Competencies
              </label>
              <div className="flex flex-wrap gap-2">
                {cycle.coreCompetencies.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
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
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  )
}
