import { useState } from 'react'
import type { PlanCycle } from '../../../hooks/useQuarterlyPlan'
import { cn } from '../../../utils/classNames'
import { Edit2, Calendar } from 'lucide-react'
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

  const cycleNum = cycle.id.split('-')[1]?.replace('cycle', '') || cycleIndex

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border transition-all duration-300',
        isActive
          ? 'bg-white border-emerald-200 shadow-md shadow-emerald-50/50'
          : isCompleted
          ? 'bg-gray-50/50 border-gray-200 opacity-90'
          : 'bg-white border-gray-100 shadow-sm',
        className
      )}
    >
      {/* Active Indicator Strip */}
      {isActive && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
      )}

      <div className="p-5 pl-6">
        {/* Header Row: Title and Status */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-900 transition-colors leading-snug">
              <span className={cn(
                "inline-block mr-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider align-middle relative -top-0.5",
                isActive ? "bg-emerald-100 text-emerald-700" :
                isCompleted ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-500"
              )}>
                Cycle {cycleNum}
              </span>
              {cycle.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Edit cycle"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}

            {onStatusChange && (
              <div className="relative">
                <select
                  value={cycle.status}
                  onChange={(e) => handleStatusChange(e.target.value as PlanCycle['status'])}
                  className={cn(
                    "appearance-none pl-2.5 pr-7 py-1 text-[10px] font-bold rounded-md border-0 cursor-pointer focus:outline-none focus:ring-2 transition-colors uppercase tracking-wider",
                    isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" :
                    isCompleted ? "bg-green-50 text-green-700 hover:bg-green-100" :
                    "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">Active</option>
                  <option value="completed">Done</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400">
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meta Row: Date & Theme */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Week {cycle.startWeek} - {cycle.endWeek}</span>
          </div>
          {cycle.theme && (
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-xs italic text-gray-600">"{cycle.theme}"</span>
            </div>
          )}
        </div>

        {/* Description & Competencies */}
        <div className="space-y-3">
          {cycle.description && (
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">
              {cycle.description}
            </p>
          )}

          {cycle.coreCompetencies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {cycle.coreCompetencies.map((skill) => (
                <span
                  key={skill}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border transition-colors",
                    isActive 
                      ? "bg-emerald-50/50 text-emerald-700 border-emerald-100/50" 
                      : "bg-gray-50 text-gray-500 border-gray-100"
                  )}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
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
