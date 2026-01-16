import { useState } from 'react'
import type { PlanCycle } from '../../../hooks/useQuarterlyPlan'
import { cn } from '../../../utils/classNames'
import { Edit2 } from 'lucide-react'
import { CycleEditModal } from './CycleEditModal'

interface CycleCardProps {
  cycle: PlanCycle
  cycleIndex?: number
  className?: string
  onStatusChange?: (status: PlanCycle['status']) => void
  onEdit?: (updates: { name?: string; theme?: string; description?: string }) => void
}

export function CycleCard({ cycle, cycleIndex, className, onStatusChange, onEdit }: CycleCardProps) {
  const isActive = cycle.status === 'in_progress'
  const isCompleted = cycle.status === 'completed'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleStatusChange = (newStatus: PlanCycle['status']) => {
    if (onStatusChange && newStatus !== cycle.status) {
      onStatusChange(newStatus)
    }
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-5 transition-all flex items-start gap-4',
        isActive
          ? 'border-emerald-400 shadow-md shadow-emerald-50'
          : isCompleted
          ? 'border-green-300 bg-green-50/20'
          : 'border-gray-200',
        className
      )}
    >
      {/* Left: Cycle number indicator */}
      <div className={cn(
        "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
        isActive ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400" :
        isCompleted ? "bg-green-100 text-green-700" :
        "bg-gray-100 text-gray-400"
      )}>
        {cycle.id.split('-')[1]?.replace('cycle', 'C') || 'C'}
      </div>

      {/* Middle: Cycle info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{cycle.name}</h3>
            <div className="text-sm text-gray-500">
              Week {cycle.startWeek} - {cycle.endWeek}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit button */}
            {onEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Edit cycle"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}

            {/* Status badge */}
            <div className="shrink-0">
            {onStatusChange ? (
              <select
                value={cycle.status}
                onChange={(e) => handleStatusChange(e.target.value as PlanCycle['status'])}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2",
                  isActive ? "bg-emerald-600 text-white focus:ring-emerald-500" :
                  isCompleted ? "bg-green-600 text-white focus:ring-green-500" :
                  "bg-gray-500 text-white focus:ring-gray-400"
                )}
              >
                <option value="not_started">NOT STARTED</option>
                <option value="in_progress">ACTIVE</option>
                <option value="completed">DONE</option>
              </select>
            ) : (
              <span className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg",
                isActive ? "bg-emerald-600 text-white" :
                isCompleted ? "bg-green-600 text-white" :
                "bg-gray-500 text-white"
              )}>
                {isActive ? 'ACTIVE' : isCompleted ? 'DONE' : 'NOT STARTED'}
              </span>
            )}
          </div>
          </div>
        </div>

        {/* Theme */}
        {cycle.theme && (
          <div className="mb-2 text-sm text-gray-700 italic">
            "{cycle.theme}"
          </div>
        )}

        {/* Description */}
        {cycle.description && (
          <div className="mb-3 text-sm text-gray-600 leading-snug break-words">
            {cycle.description}
          </div>
        )}

        {/* Core Competencies */}
        {cycle.coreCompetencies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cycle.coreCompetencies.map((skill) => (
              <span
                key={skill}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-full",
                  isActive ? "bg-emerald-100 text-emerald-700" :
                  isCompleted ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-600"
                )}
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {onEdit && (
        <CycleEditModal
          cycle={cycle}
          cycleIndex={cycleIndex}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={onEdit}
        />
      )}
    </div>
  )
}
